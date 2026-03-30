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
      if (!userId) {
          return "The shopper is a guest friend who appreciates effortless elegance. They want to see the best of ShopNest's curation.";
      }
      
      try {
      const [user, orders, wishlist] = await Promise.all([
        require('../models/User').findById(userId),
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

      const categoryCounts = {};
      interests.categories.forEach(cat => categoryCounts[cat] = (categoryCounts[cat] || 0) + 1);
      interests.wishlistedCategories.forEach(cat => categoryCounts[cat] = (categoryCounts[cat] || 0) + 1);
      
      const favoriteCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b, 'General');
      const latestItem = interests.prevProducts[interests.prevProducts.length - 1] || 'none';

      const profile = `The user's name is ${user?.name || 'Friend'}. 
        They are a sophisticated shopper who gravitates towards ${favoriteCategory}. 
        They recently explored "${latestItem}" and have a history with ${Array.from(interests.categories).join(', ')}.`;

      return profile;
    } catch (error) {
      console.error('Error in _getUserInterestProfile:', error);
      return "A valued ShopNest customer";
    }
  }

  /**
   * Get personalized recommendations for a user.
   */
  async getPersonalizedRecommendations(userId) {
    try {
      const userProfile = await this._getUserInterestProfile(userId);

      const allProducts = await Product.find({ countInStock: { $gt: 0 } }).limit(150);
      const shuffledProducts = allProducts.sort(() => 0.5 - Math.random());
      const candidateSubset = shuffledProducts.slice(0, 40);

      const productList = candidateSubset.map(p => ({
        id: p._id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price,
        description: p.description
      }));

      const freshnessSeed = Math.random().toString(36).substring(7);

      const prompt = `
        You are ShopNest's Lead Personal Stylist. You are speaking directly to your VIP client.
        
        USER CONTEXT:
        ${userProfile}
        
        YOUR CURATED COLLECTION:
        ${JSON.stringify(productList)}

        SESSION TOKEN: ${freshnessSeed}
        
        STRICT STYLIST PROTOCOL:
        1. NO ROBOTIC TEMPLATES. NEVER start with "Since you liked", "Because you viewed", or "Recommended because".
        2. SOPHISTICATED VOCABULARY. Use words like "aesthetic," "ethos," "silhouette," "artisan," "curation," or "versatility."
        3. SPEAK AS A HUMAN. Use first-person ("I caught a glimpse...", "I've been thinking about what would suit you...").
        4. TRUE UNIQUENESS. Every single reason MUST follow a completely different sentence structure and logic.
        5. LOGICAL PAIRING. If they liked Fashion, talk about fabric or fit. If Electronics, talk about performance or design philosophy.
        6. WARM AUTHORITATIVE TONE. Be an expert friend. Use phrases like "I stumbled upon this and immediately thought of your taste...", "This piece has a certain character that would perfectly punctuate your current collection...".
        
        RESPONSE FORMAT (JSON ONLY):
        [
          {
            "id": "product_mongodb_id",
            "reason": "your unique, human stylist note"
          }
        ]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const recommendations = JSON.parse(text);

      const recommendedProductIds = recommendations.map(r => r.id);
      const products = await Product.find({ _id: { $in: recommendedProductIds } });

      return products.map(p => {
        const rec = recommendations.find(r => r.id === p._id.toString());
        return {
          ...p.toObject(),
          aiReason: rec ? rec.reason : "I chose this specifically for you after looking at your favorite collections."
        };
      });
    } catch (error) {
      console.error('Error in getPersonalizedRecommendations:', error);
      const fallbackOptions = [
        "I'm still getting a feel for your sophisticated taste, but I have a strong intuition you'll appreciate the craftsmanship here.",
        "As I curate your personal lookbook, this particular piece stood out for its effortless versatility.",
        "I’ve been exploring our latest collections for you, and this find has a certain character I think you'll love.",
        "Every stylist has a favorite hidden gem, and I've selected this one as a special gift for your collection."
      ];
      
      return products.map((p, index) => ({
        ...p,
        aiReason: fallbackOptions[index % fallbackOptions.length]
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

      const candidateProducts = await Product.find({
        _id: { $ne: productId },
        category: currentProduct.category,
        countInStock: { $gt: 0 }
      }).limit(50);

      const shuffledCandidates = candidateProducts.sort(() => 0.5 - Math.random());
      const selectedCandidates = shuffledCandidates.slice(0, 20);
      const freshnessSeed = Math.random().toString(36).substring(7);

      const prompt = `
        You are ShopNest's Expert Advisor. Your client is admiring the "${currentProduct.name}".
        Find 4 items from the list below that would either pair beautifully with it or provide a sophisticated alternative.
        
        CANDIDATES:
        ${JSON.stringify(selectedCandidates.map(p => ({ id: p._id, name: p.name, description: p.description })))}
        
        PROTOCOL:
        Stay human. Explain the relationship between the items. 
        Example: "I recommended this because it shares the same minimalist ethos as the item you're viewing." or "If you loved the texture of that, you'll find this experience very similar."
        
        RESPONSE FORMAT (JSON ONLY):
        [
          {
            "id": "product_mongodb_id",
            "reason": "your thoughtful stylist note"
          }
        ]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const recommendations = JSON.parse(text);

      const similarIds = recommendations.map(r => r.id);
      const products = await Product.find({ _id: { $in: similarIds } });

      return products.map(p => {
        const rec = recommendations.find(r => r.id === p._id.toString());
        return {
          ...p.toObject(),
          aiReason: rec ? rec.reason : "I think this would be a wonderful companion piece to what you're seeing right now."
        };
      });
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      const p = await Product.findById(productId);
      if (!p) return [];

      const similarProducts = await Product.aggregate([
        { $match: { _id: { $ne: p._id }, category: p.category, countInStock: { $gt: 0 } } },
        { $sample: { size: 4 } }
      ]);
      return similarProducts.map(sp => ({
        ...sp,
        aiReason: `I noticed this pairs beautifully with what you're currently viewing!`
      }));
    }
  }
}

module.exports = new RecommendationService();
