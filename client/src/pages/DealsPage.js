// client/src/pages/DealsPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaFire,
  FaGift,
  FaTruck,
  FaCrown,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaArrowLeft,
  FaImage
} from 'react-icons/fa';
import api from '../services/api';
import { formatINRSimple } from '../utils/currency';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';

const DealsPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const dealType = searchParams.get('type') || 'today';

  // Debug logs
  console.log('📌 DealsPage loaded with dealType:', dealType);
  console.log('📌 Full URL:', window.location.href);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [error, setError] = useState(null);

  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Deal configurations
  const deals = {
    today: {
      title: "Today's Deals",
      icon: <FaFire className="text-2xl" />,
      color: 'from-red-500 to-red-600',
      description: "Electronics under ₹5000 - Limited time offers!",
      filter: (p) => p.category === 'Electronics' && p.price < 5000
    },
    summer: {
      title: 'Summer Sale',
      icon: <FaGift className="text-2xl" />,
      color: 'from-yellow-500 to-yellow-600',
      description: "Fashion up to 40% off - Limited time offers!",
      filter: (p) => p.category === 'Fashion'
    },
    home: {
      title: 'Home Essentials',
      icon: <FaTruck className="text-2xl" />,
      color: 'from-green-500 to-green-600',
      description: "Kitchen & Home decor - Transform your living space",
      filter: (p) => p.category === 'Home & Kitchen'
    },
    freeshipping: {
      title: 'Free Shipping',
      icon: <FaTruck className="text-2xl" />,
      color: 'from-blue-500 to-blue-600',
      description: "Products with free shipping",
      filter: (p) => p.price > 500
    },
    premium: {
      title: 'Premium Offers',
      icon: <FaCrown className="text-2xl" />,
      color: 'from-purple-500 to-purple-600',
      description: "Premium products at great prices",
      filter: (p) => p.price > 5000
    }
  };

  const currentDeal = deals[dealType] || deals.today;

  useEffect(() => {
    console.log('🔄 Fetching all products...');
    fetchAllProducts();
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (allProducts.length > 0) {
      console.log(`🔄 Filtering products for deal type: ${dealType}`);
      filterProducts();
    }
  }, [dealType, allProducts]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/products?limit=200');
      const fetchedProducts = data.products || [];
      console.log(`✅ Loaded ${fetchedProducts.length} products`);
      setAllProducts(fetchedProducts);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setError('Failed to load products. Please try again.');
      setLoading(false);
    }
  };

  const filterProducts = () => {
    try {
      // Filter products based on deal type
      console.log(`🔍 Applying filter for: ${dealType}`);
      let filtered = allProducts.filter(currentDeal.filter);
      console.log(`📊 Found ${filtered.length} products matching filter`);

      if (filtered.length === 0) {
        console.log('⚠️ No products found for this filter. Showing random products instead.');
        filtered = allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);
      } else {
        filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, 8);
      }

      // Add random original prices for discount display
      filtered = filtered.map(p => ({
        ...p,
        originalPrice: p.price * (1.3 + (Math.random() * 0.3)),
        discount: Math.floor(Math.random() * 30) + 20
      }));

      setProducts(filtered);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error filtering products:', error);
      setError('Error filtering products');
      setLoading(false);
    }
  };

  const handleWishlistToggle = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please login to add items to wishlist');
      return;
    }

    try {
      const isInWishlist = wishlistItems?.some(item =>
        item.product?._id === product._id || item.product === product._id
      );

      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        console.log('✅ Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        console.log('✅ Added to wishlist');
      }

      await dispatch(fetchWishlist());
    } catch (error) {
      console.error('❌ Wishlist error:', error);
    }
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      qty: 1,
    }));

    alert('✅ Added to cart!');
  };

  const isProductInWishlist = (productId) => {
    return wishlistItems?.some(item =>
      item.product?._id === productId || item.product === productId
    );
  };

  const Rating = ({ value, count }) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star}>
              {value >= star ? (
                <FaStar className="text-yellow-400 text-sm" />
              ) : value >= star - 0.5 ? (
                <FaStarHalfAlt className="text-yellow-400 text-sm" />
              ) : (
                <FaRegStar className="text-yellow-400 text-sm" />
              )}
            </span>
          ))}
        </div>
        <span className="text-sm text-gray-500">({count?.toLocaleString()})</span>
      </div>
    );
  };

  // Image fallback handler
  const handleImageError = (e) => {
    e.target.onerror = null;
    const colors = ['#f3f4f6', '#fff1f2', '#f0f9ff', '#f0fdf4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="${encodeURIComponent(randomColor)}"/><path d="M150 100l50 80H100z" fill="%23cbd5e1"/><circle cx="150" cy="150" r="40" stroke="%2394a3b8" stroke-width="2" fill="none"/><text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="bold" font-size="14" fill="%2364748b">ShopNest Premium</text></svg>`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Back to Home Link */}
      <div className="container mx-auto px-4 py-4">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors">
          <FaArrowLeft /> Back to Home
        </Link>
      </div>

      {/* Deal Header */}
      <div className={`bg-gradient-to-r ${currentDeal.color} text-white py-12`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{currentDeal.icon}</div>
            <div>
              <h1 className="text-4xl font-bold">{currentDeal.title}</h1>
              <p className="text-xl opacity-90 mt-2">{currentDeal.description}</p>
              <p className="text-sm opacity-75 mt-1">Deal Type: {dealType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Categories Navigation */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-4">
            {Object.entries(deals).map(([key, deal]) => (
              <Link
                key={key}
                to={`/deals?type=${key}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${dealType === key
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {deal.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {products.length > 0 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">Showing {products.length} products</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden relative group flex flex-col h-full">
                  <Link to={`/product/${product._id}`}>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-48 object-contain p-4 hover:scale-105 transition-transform bg-gray-50"
                      onError={handleImageError}
                    />
                  </Link>

                  <button
                    onClick={(e) => handleWishlistToggle(product, e)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg z-10"
                    title={isProductInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isProductInWishlist(product._id) ? (
                      <FaHeart className="text-red-500 text-xl" />
                    ) : (
                      <FaRegHeart className="text-gray-600 text-xl hover:text-red-500" />
                    )}
                  </button>

                  <div className="p-4 flex flex-col flex-grow">
                    <Link to={`/product/${product._id}`}>
                      <h3 className="font-semibold mb-1 hover:text-yellow-600 line-clamp-2 text-sm">
                        {product.name}
                      </h3>
                    </Link>

                    <Rating value={product.rating} count={product.numReviews} />

                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-yellow-600">
                        {formatINRSimple(product.price)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatINRSimple(product.originalPrice)}
                      </span>
                      <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded">
                        -{Math.round(product.discount)}%
                      </span>
                    </div>

                    <p className="text-green-600 text-xs mt-1">You save: {formatINRSimple(product.originalPrice - product.price)}</p>
                    <p className="text-green-600 font-semibold text-xs mt-1">In Stock</p>

                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`mt-auto pt-3 w-full bg-gradient-to-r ${currentDeal.color} text-white py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm font-bold flex items-center justify-center gap-2`}
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <FaImage className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found for this deal</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different deal category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;