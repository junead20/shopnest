// client/src/pages/Wishlist.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaShoppingCart, FaTrash, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { fetchWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { formatINRSimple } from '../utils/currency';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, user]);

  const handleRemoveFromWishlist = async (productId) => {
    await dispatch(removeFromWishlist(productId));
    dispatch(fetchWishlist()); // Refresh wishlist
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.imageUrl,
      qty: 1,
    }));
    navigate('/cart');
  };

  const Rating = ({ value }) => {
    return (
      <div className="flex items-center gap-1">
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
    );
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Please login to view your wishlist</h2>
        <Link
          to="/login"
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
        >
          Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <FaHeart className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save your favorite items here</p>
        <Link
          to="/"
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist ({items.length} items)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          
          return (
            <div key={product._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative group">
              <Link to={`/product/${product._id}`}>
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-contain p-4 group-hover:scale-105 transition-transform"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/200?text=Product'}
                />
              </Link>
              
              <button
                onClick={() => handleRemoveFromWishlist(product._id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                title="Remove from wishlist"
              >
                <FaTrash className="text-red-500" />
              </button>
              
              <div className="p-4">
                <Link to={`/product/${product._id}`}>
                  <h3 className="font-semibold text-lg mb-2 hover:text-yellow-500 line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-gray-600 text-sm mb-2">{product.brand}</p>
                
                <Rating value={product.rating} />
                
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-2xl font-bold text-yellow-600">
                    {formatINRSimple(product.price)}
                  </span>
                </div>

                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={product.countInStock === 0}
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white font-semibold ${
                    product.countInStock > 0
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaShoppingCart />
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;