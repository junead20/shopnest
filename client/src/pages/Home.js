// client/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaChevronLeft,
  FaChevronRight,
  FaMagic,
  FaLightbulb,
  FaLaptop,
  FaTshirt,
  FaHome,
  FaBook,
  FaRunning,
  FaGamepad
} from 'react-icons/fa';
import RecommendationsSection from '../components/RecommendationsSection';
import gsap from 'gsap';
import api from '../services/api';
import { ProductCardSkeleton } from '../components/Skeleton';
import { formatINRSimple } from '../utils/currency';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // SIMPLE DIRECT FUNCTIONS - NO ARRAYS, NO OBJECTS
  const handleTodayClick = () => {
    console.log('🚀 TODAYS DEALS CLICKED - Going to /deals?type=today');
    window.location.href = 'http://localhost:3000/deals?type=today'; // Direct window location change
  };

  const handleSummerClick = () => {
    console.log('🌞 SUMMER SALE CLICKED - Going to /deals?type=summer');
    window.location.href = 'http://localhost:3000/deals?type=summer';
  };

  const handleHomeClick = () => {
    console.log('🏠 HOME ESSENTIALS CLICKED - Going to /deals?type=home');
    window.location.href = 'http://localhost:3000/deals?type=home';
  };

  const categories = [
    { name: 'Electronics', icon: <FaLaptop />, color: 'bg-blue-50 text-blue-600', hover: 'hover:bg-blue-600' },
    { name: 'Fashion', icon: <FaTshirt />, color: 'bg-pink-50 text-pink-600', hover: 'hover:bg-pink-600' },
    { name: 'Home & Kitchen', icon: <FaHome />, color: 'bg-orange-50 text-orange-600', hover: 'hover:bg-orange-600' },
    { name: 'Books', icon: <FaBook />, color: 'bg-green-50 text-green-600', hover: 'hover:bg-green-600' },
    { name: 'Sports', icon: <FaRunning />, color: 'bg-red-50 text-red-600', hover: 'hover:bg-red-600' },
    { name: 'Toys & Games', icon: <FaGamepad />, color: 'bg-purple-50 text-purple-600', hover: 'hover:bg-purple-600' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [user, dispatch]);

  // GSAP Animation for product cards
  useEffect(() => {
    if (!loading && featuredProducts.length > 0) {
      gsap.fromTo('.home-product-card',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [loading, featuredProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data } = await api.get('/products?limit=100');
      const products = data.products || [];
      console.log(`✅ Loaded ${products.length} products`);

      setAllProducts(products);
      setFeaturedProducts(products.slice(0, 8));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
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
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
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

  const FALLBACK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="%239ca3af">📷</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="%239ca3af">No Image</text></svg>`;

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_SVG;
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

  const ProductCard = ({ product, isInWishlist, onWishlistToggle, onAddToCart }) => (
    <div className="home-product-card bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden relative group flex flex-col h-full">
      <Link to={`/product/${product._id}`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-contain p-4 hover:scale-105 transition-transform bg-gray-50"
          onError={handleImageError}
        />
      </Link>

      <button
        onClick={(e) => onWishlistToggle(product, e)}
        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg z-10"
        title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isInWishlist ? (
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

        <div className="mt-2">
          <span className="text-xl font-bold text-yellow-600">
            {formatINRSimple(product.price)}
          </span>
        </div>

        <button
          onClick={(e) => onAddToCart(product, e)}
          className="mt-auto pt-3 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm font-semibold"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );


  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Hero Carousel - DIRECT BUTTONS - NO ARRAYS */}
      <div className="relative w-full h-[400px] overflow-hidden">
        {/* Slide 1 - Today's Deals */}
        <div
          onClick={handleTodayClick}
          className="absolute w-full h-full transition-opacity duration-1000 cursor-pointer opacity-100"
          style={{ zIndex: currentSlide === 0 ? 10 : 0, opacity: currentSlide === 0 ? 1 : 0 }}
        >
          <img
            src="https://images.pexels.com/photos/3945667/pexels-photo-3945667.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Today's Deals"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Today's Deals</h2>
              <p className="text-xl mb-4">Electronics under ₹5000</p>
              <span className="bg-yellow-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-600 inline-block">
                Shop Deals
              </span>
            </div>
          </div>
        </div>

        {/* Slide 2 - Summer Sale */}
        <div
          onClick={handleSummerClick}
          className="absolute w-full h-full transition-opacity duration-1000 cursor-pointer"
          style={{ zIndex: currentSlide === 1 ? 10 : 0, opacity: currentSlide === 1 ? 1 : 0 }}
        >
          <img
            src="https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Summer Sale"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Summer Sale</h2>
              <p className="text-xl mb-4">Fashion up to 40% off</p>
              <span className="bg-yellow-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-600 inline-block">
                Shop Fashion
              </span>
            </div>
          </div>
        </div>

        {/* Slide 3 - Home Essentials */}
        <div
          onClick={handleHomeClick}
          className="absolute w-full h-full transition-opacity duration-1000 cursor-pointer"
          style={{ zIndex: currentSlide === 2 ? 10 : 0, opacity: currentSlide === 2 ? 1 : 0 }}
        >
          <img
            src="https://images.pexels.com/photos/276528/pexels-photo-276528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Home Essentials"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">Home Essentials</h2>
              <p className="text-xl mb-4">Kitchen & Home decor</p>
              <span className="bg-yellow-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-600 inline-block">
                Shop Home
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all z-20"
        >
          <FaChevronLeft size={24} />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all z-20"
        >
          <FaChevronRight size={24} />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-yellow-500 w-8' : 'bg-white'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Featured Products */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              // Show 8 skeletons while loading
              [...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)
            ) : (
              featuredProducts.map(product => (
                <ProductCard
                  key={product._id}
                  product={product}
                  isInWishlist={isProductInWishlist(product._id)}
                  onWishlistToggle={handleWishlistToggle}
                  onAddToCart={handleAddToCart}
                />
              ))
            )}
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/category/${encodeURIComponent(cat.name)}`}
                className="group relative bg-white rounded-2xl p-6 text-center premium-card border border-gray-100 flex flex-col items-center gap-4"
              >
                <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center text-3xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm`}>
                  {cat.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 group-hover:text-yellow-600 transition-colors">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">Explore ShopNest →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {user ? (
          <RecommendationsSection type="personalized" title="Recommended for You" />
        ) : (
          <div className="mb-12 bg-gradient-to-r from-yellow-50 to-orange-50 p-8 rounded-3xl border border-yellow-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <FaMagic className="text-yellow-500" /> Unlock Personalized Recommendations
              </h2>
              <p className="text-gray-600">Sign in to see products picked just for you by our AI assistant.</p>
            </div>
            <Link to="/login" className="bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-yellow-600 transition-all shadow-lg hover:shadow-yellow-200">
              Sign In Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;