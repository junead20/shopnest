const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');

class RecommendationService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log(`🤖 RecommendationService initialized with key: ${process.env.GEMINI_API_KEY ? 'Present (ending in ' + process.env.GEMINI_API_KEY.slice(-4) + ')' : 'MISSING'}`);
  }

  /**
   * Generates a text-based user interest profile from their previous orders and wishlist.
   */
  async _getUserInterestProfile(userId) {
    try {
      const [orders, wishlist] = await Promise.all([
        Order.find({ user: userId }).populate('orderItems.product'),
        Wishlist.findOne({ user: userId }).populate('items.product')
      ]);

      const interests = {
        categories: new Set(),
        prevProducts: [],
        wishlistedCategories: new Set()
      };

      if (orders) {
        orders.forEach(order => {
          order.orderItems.forEach(item => {
            if (item.product) {
              interests.categories.add(item.product.category);
              interests.prevProducts.push(item.product.name);
            }
          });
        });
      }

      if (wishlist && wishlist.items) {
        wishlist.items.forEach(item => {
          if (item.product) {
            interests.wishlistedCategories.add(item.product.category);
            interests.prevProducts.push(item.product.name);
          }
        });
      }

      const profile = `User is interested in categories: ${Array.from(new Set([...interests.categories, ...interests.wishlistedCategories])).join(', ')}. 
        Products previously interacted with: ${interests.prevProducts.slice(-10).join(', ')}.`;

      return profile;
    } catch (error) {
      console.error('Error in _getUserInterestProfile:', error);
      return "General shopper";
    }
  }

  /**
   * Get personalized recommendations for a user.
   */
  async getPersonalizedRecommendations(userId) {
    try {
      const userProfile = await this._getUserInterestProfile(userId);

      // Fetch a larger pool of items and shuffle them for freshness
      const allProducts = await Product.find({ countInStock: { $gt: 0 } }).limit(150);
      const shuffledProducts = allProducts.sort(() => 0.5 - Math.random());

      // Send a random subset of 40 products to the AI
      const candidateSubset = shuffledProducts.slice(0, 40);

      const productList = candidateSubset.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price
      }));

      // Add a random "freshness seed" to ensure the AI doesn't pick the same things every time
      const freshnessSeed = Math.random().toString(36).substring(7);

      const prompt = `
        As an expert shopping assistant, recommend the top 6 products from the provided list for this user.
        
        USER PROFILE:
        ${userProfile}
        
        PRODUCT LIST:
        ${JSON.stringify(productList)}

        CONTEXT FOR FRESHNESS:
        Refresh Seed: ${freshnessSeed}
        IMPORTANT: Avoid recommending items you think might have been shown recently. Be adventurous and prioritize variety.
        
        RESPONSE FORMAT (JSON ONLY):
        [
          {
            "id": "product_mongodb_id",
            "reason": "short explanation why this is recommended for this user"
          }
        ]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      // Clean JSON in case AI adds markdown
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const recommendations = JSON.parse(text);

      const recommendedProductIds = recommendations.map(r => r.id);
      const products = await Product.find({ _id: { $in: recommendedProductIds } });

      return products.map(p => {
        const rec = recommendations.find(r => r.id === p._id.toString());
        return {
          ...p.toObject(),
          aiReason: rec ? rec.reason : "Based on your behavior"
        };
      });
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      // Fallback: return any random selection of 6 products
      const products = await Product.aggregate([{ $sample: { size: 6 } }]);
      return products.map(p => ({
        ...p,
        aiReason: "You might like these popular picks"
      }));
    }
  }

  /**
   * Get similar products using AI semantic matching.
   */
  async getSimilarProducts(productId) {
    try {
      const currentProduct = await Product.findById(productId);
      if (!currentProduct) return [];

      // Fetch a broader set of potential similar items
      const candidateProducts = await Product.find({
        _id: { $ne: productId },
        category: currentProduct.category,
        countInStock: { $gt: 0 }
      }).limit(50);

      // Shuffle and pick a smaller set for the AI to analyze deeply
      const shuffledCandidates = candidateProducts.sort(() => 0.5 - Math.random());
      const selectedCandidates = shuffledCandidates.slice(0, 20);

      const freshnessSeed = Math.random().toString(36).substring(7);

      const prompt = `
        Given the product "${currentProduct.name}" in category "${currentProduct.category}", 
        select the top 4 most similar or complementary items from the following list.
        
        Session Seed: ${freshnessSeed}

        CANDIDATES:
        ${JSON.stringify(selectedCandidates.map(p => ({ id: p._id, name: p.name, description: p.description })))}
        
        RESPONSE FORMAT (JSON ONLY):
        ["product_id1", "product_id2", ...]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const similarIds = JSON.parse(text);

      return Product.find({ _id: { $in: similarIds } });
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      // Fallback: random selection from same category
      const p = await Product.findById(productId);
      if (!p) return [];

      const similarProducts = await Product.aggregate([
        { $match: { _id: { $ne: p._id }, category: p.category, countInStock: { $gt: 0 } } },
        { $sample: { size: 4 } }
      ]);
      return similarProducts;
    }
  }
}

module.exports = new RecommendationService();
