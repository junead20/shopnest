// client/src/pages/SearchResults.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaHeart,
  FaRegHeart,
  FaShoppingCart
} from 'react-icons/fa';
import api from '../services/api';
import ProductImage from '../components/ProductImage';
import { formatINRSimple } from '../utils/currency';
import { addToWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');

  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (query) {
      searchProducts();
    }
  }, [query, sortBy]);

  const searchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products?search=${encodeURIComponent(query)}`);
      let results = data.products || [];

      // Apply sorting
      if (sortBy === 'price-low') {
        results.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-high') {
        results.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        results.sort((a, b) => b.rating - a.rating);
      }

      setProducts(results);
      setLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setLoading(false);
    }
  };

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Search results for "{query}"
        </h1>
        <p className="text-gray-600">{products.length} products found</p>
      </div>

      {/* Sort Options */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-end">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="relevance">Sort by: Relevance</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Avg. Rating</option>
        </select>
      </div>

      {/* Results */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative group flex flex-col h-full">
              <Link to={`/product/${product._id}`}>
                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform bg-gray-50"
                />
              </Link>

              <button
                onClick={(e) => handleWishlistToggle(product, e)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg z-10"
                title={isProductInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isProductInWishlist(product._id) ? (
                  <FaHeart className="text-red-500" />
                ) : (
                  <FaRegHeart className="text-gray-600" />
                )}
              </button>

              <div className="p-4 flex flex-col flex-grow">
                <Link to={`/product/${product._id}`}>
                  <h3 className="font-semibold mb-1 hover:text-yellow-600 line-clamp-2">
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
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/product/${product._id}`);
                  }}
                  className="mt-auto pt-3 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                >
                  <FaShoppingCart /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-lg">No products found matching "{query}"</p>
          <p className="text-gray-400 mt-2">Try checking your spelling or using different keywords</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
          >
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default SearchResults;