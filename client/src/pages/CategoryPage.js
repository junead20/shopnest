// client/src/pages/CategoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaFilter,
  FaSort
} from 'react-icons/fa';
import api from '../services/api';
import { formatINRSimple } from '../utils/currency';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { useToast } from '../context/ToastContext';

const CategoryPage = () => {
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');
  const [totalProducts, setTotalProducts] = useState(0);

  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Get ALL products for this category (no limit)
      const url = `/products?category=${encodeURIComponent(categoryName)}&limit=1000`;

      const { data } = await api.get(url);
      let fetchedProducts = data.products || [];

      setTotalProducts(fetchedProducts.length);

      // Apply sorting
      if (sortBy === 'price-low') {
        fetchedProducts.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high') {
        fetchedProducts.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        fetchedProducts.sort((a, b) => b.rating - a.rating);
      }

      // Apply price filter
      if (priceRange !== 'all') {
        const [min, max] = priceRange.split('-').map(Number);
        fetchedProducts = fetchedProducts.filter(p => p.price >= min && p.price <= max);
      }

      setProducts(fetchedProducts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  }, [categoryName, sortBy, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [user, dispatch]);





  const handleWishlistToggle = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    const isInWishlist = wishlistItems?.some(item =>
      item.product?._id === product._id || item.product === product._id
    );

    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      qty: 1,
    }));

    showToast('Success! Your item is now in the cart.', 'success');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Simple Category Header - No Image */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{categoryName}</h1>
          <p className="text-gray-600 mt-1">{totalProducts} products found</p>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="container mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" />
            <span className="font-semibold">Filter by price:</span>
          </div>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Prices</option>
            <option value="0-500">Under ₹500</option>
            <option value="500-2000">₹500 - ₹2000</option>
            <option value="2000-5000">₹2000 - ₹5000</option>
            <option value="5000-10000">₹5000 - ₹10000</option>
            <option value="10000-50000">Above ₹10000</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <FaSort className="text-gray-500" />
            <span className="font-semibold">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded px-3 py-1 text-sm"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Avg. Rating</option>
            </select>
          </div>
        </div>

        {/* Products Grid - ALL products displayed */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative group flex flex-col h-full">
                <Link to={`/product/${product._id}`}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-40 object-contain p-4 group-hover:scale-105 transition-transform bg-gray-50"
                    onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23e5e7eb"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="%239ca3af">📷</text><text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="%239ca3af">No Image</text></svg>`; }}
                  />
                </Link>

                <button
                  onClick={(e) => handleWishlistToggle(product, e)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg z-10"
                >
                  {isProductInWishlist(product._id) ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FaRegHeart className="text-gray-600" />
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
                    <span className="text-lg font-bold text-yellow-600">
                      {formatINRSimple(product.price)}
                    </span>
                  </div>

                  <p className="text-green-600 text-xs mt-1">In Stock</p>

                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="mt-auto pt-2 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <FaShoppingCart /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg mt-6">
            <p className="text-gray-500 text-lg">No products found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;