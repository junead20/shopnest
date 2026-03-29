// client/src/pages/ProductDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaShoppingCart,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaArrowLeft,
  FaCheck,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaRupeeSign,
  FaUsers,
  FaTimes
} from 'react-icons/fa';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import api from '../services/api';
import ProductImage from '../components/ProductImage';
import RecommendationsSection from '../components/RecommendationsSection';
import { ProductDetailsSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [addedToGroup, setAddedToGroup] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('description');

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [fetchProduct, dispatch, user]);

  useEffect(() => {
    if (product && wishlistItems) {
      const inWishlist = wishlistItems.some(item =>
        item.product?._id === product._id || item.product === product._id
      );
      setIsInWishlist(inWishlist);
    }
  }, [product, wishlistItems]);



  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      qty: quantity,
    }));

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleWishlistToggle = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product._id));
    }
  };

  const handleAddToGroupClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.get('/group-cart/user/my-groups');
      setUserGroups(data || []);
      setShowGroupModal(true);
    } catch (e) {
      showToast('We encountered a slight issue fetching your groups. Please try again.', 'error');
    }
  };

  const confirmAddToGroup = async (groupToken) => {
    try {
      await api.put('/group-cart/add-item', { 
        token: groupToken, 
        productId: product._id, 
        quantity 
      });
      setAddedToGroup(true);
      setShowGroupModal(false);
      setTimeout(() => setAddedToGroup(false), 3000);
    } catch (error) {
      console.error('Error adding to group:', error);
      showToast('I couldn’t add this to your group right now. Your session may have timed out.', 'error');
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    dispatch(addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      image: product.imageUrl,
      qty: quantity,
    }));

    navigate('/checkout');
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const Rating = ({ value, text, size = "text-xl" }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {value >= star ? (
              <FaStar className={`text-yellow-500 ${size}`} />
            ) : value >= star - 0.5 ? (
              <FaStarHalfAlt className={`text-yellow-500 ${size}`} />
            ) : (
              <FaRegStar className={`text-yellow-500 ${size}`} />
            )}
          </span>
        ))}
        {text && <span className="ml-2 text-gray-600">{text}</span>}
      </div>
    );
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-3xl font-bold text-gray-600 mb-4">Product not found</h2>
        <p className="text-gray-500 mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
        >
          <FaArrowLeft />
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Group Selection Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FaUsers className="text-purple-600" /> Select a Group
              </h3>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {userGroups.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">You haven't joined any groups yet.</p>
                  <button onClick={() => {setShowGroupModal(false); navigate('/group-shop');}} className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-bold">Create a Group</button>
                </div>
              ) : (
                userGroups.map(g => (
                  <button
                    key={g._id}
                    onClick={() => confirmAddToGroup(g.shareToken)}
                    className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-purple-300 hover:bg-purple-50 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{g.name}</div>
                      <div className="text-sm text-gray-500">{g.members?.length || 1} Members</div>
                    </div>
                    <div className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold opacity-0 group-[&:hover]:opacity-100 transition-opacity whitespace-nowrap ml-4">
                      Add Item
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-yellow-500 mb-6 transition-colors"
      >
        <FaArrowLeft /> Back
      </button>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <div
            className="mb-4 border-2 rounded-lg overflow-hidden bg-white relative group cursor-zoom-in h-96 flex items-center justify-center p-4"
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Base Image */}
            <img
              src={product.images?.[selectedImage] || product.imageUrl}
              alt={product.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/600?text=Image+Not+Available';
              }}
              className={`w-full h-full object-contain transition-opacity duration-300 ${isZooming ? 'opacity-0' : 'opacity-100'}`}
            />

            {/* Zoomed Image Overlay */}
            {isZooming && (
              <div
                className="absolute inset-0 w-full h-full bg-no-repeat pointer-events-none"
                style={{
                  backgroundImage: `url(${product.images?.[selectedImage] || product.imageUrl})`,
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  backgroundSize: '250%', // Zoom level
                  backgroundColor: 'white'
                }}
              />
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`border-2 rounded-lg overflow-hidden flex-shrink-0 transition-all ${selectedImage === index
                    ? 'border-yellow-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-400'
                    }`}
                >
                  <ProductImage src={img} alt="" className="w-20 h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center mb-4">
            <Rating value={product.rating} />
            <span className="ml-2 text-gray-600">
              ({product.numReviews} reviews)
            </span>
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-500">Brand:</span>
            <span className="ml-2 font-semibold">{product.brand}</span>
          </div>

          <div className="mb-4">
            <span className="text-sm text-gray-500">Category:</span>
            <span className="ml-2 font-semibold">{product.category}</span>
          </div>

          <div className="mb-6">
            <span className="text-sm text-gray-500">Availability:</span>
            {product.countInStock > 0 ? (
              <span className="ml-2 text-green-600 font-semibold">
                In Stock ({product.countInStock} available)
              </span>
            ) : (
              <span className="ml-2 text-red-600 font-semibold">Out of Stock</span>
            )}
          </div>

          <div className="border-t border-b py-4 my-4">
            <div className="flex items-center">
              <FaRupeeSign className="text-yellow-600 text-3xl" />
              <span className="text-4xl font-bold text-yellow-600">
                {product.price?.toLocaleString('en-IN')}
              </span>
            </div>
            {product.countInStock > 0 && (
              <span className="ml-2 text-green-600 text-sm">+ Free Shipping</span>
            )}
          </div>

          <p className="text-gray-700 mb-6 leading-relaxed">
            {product.description}
          </p>

          {product.countInStock > 0 && (
            <div className="mb-6">
              <label className="block font-semibold mb-2">Quantity:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border rounded-lg px-4 py-3 w-24 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {[...Array(Math.min(product.countInStock, 10)).keys()].map(x => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              disabled={product.countInStock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all ${product.countInStock > 0
                ? addedToCart
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {addedToCart ? (
                <>
                  <FaCheck />
                  Added to Cart!
                </>
              ) : (
                <>
                  <FaShoppingCart />
                  Add to Cart
                </>
              )}
            </button>

            {product.countInStock > 0 && (
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 font-semibold text-lg transition-all"
              >
                Buy Now
              </button>
            )}

            <button
              onClick={handleWishlistToggle}
              className={`p-4 rounded-lg border-2 transition-all ${isInWishlist
                ? 'bg-red-50 border-red-500 text-red-500'
                : 'border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-500'
                }`}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isInWishlist ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
            </button>

            <button
              onClick={handleAddToGroupClick}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-bold transition-all border-2 ${
                addedToGroup 
                ? 'bg-purple-600 border-purple-600 text-white' 
                : 'bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100'
              }`}
              title="Start a Group Shop"
            >
              {addedToGroup ? (
                <>
                  <FaCheck /> Added to Group!
                </>
              ) : (
                <>
                  <FaUsers size={20} /> Group Buy
                </>
              )}
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <FaTruck className="text-gray-600" />
              <span className="text-gray-700">Free delivery on orders over ₹500</span>
            </div>
            <div className="flex items-center gap-3">
              <FaUndo className="text-gray-600" />
              <span className="text-gray-700">30 days easy return</span>
            </div>
            <div className="flex items-center gap-3">
              <FaShieldAlt className="text-gray-600" />
              <span className="text-gray-700">1 year warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-12">
        <div className="border-b mb-6">
          <div className="flex gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button 
              onClick={() => setActiveTab('description')}
              className={`py-2 px-4 font-semibold transition-all border-b-2 ${
                activeTab === 'description' 
                ? 'text-yellow-500 border-yellow-500' 
                : 'text-gray-600 border-transparent hover:text-yellow-500'
              }`}
            >
              Description
            </button>
            <button 
              onClick={() => setActiveTab('specifications')}
              className={`py-2 px-4 font-semibold transition-all border-b-2 ${
                activeTab === 'specifications' 
                ? 'text-yellow-500 border-yellow-500' 
                : 'text-gray-600 border-transparent hover:text-yellow-500'
              }`}
            >
              Specifications
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-4 font-semibold transition-all border-b-2 ${
                activeTab === 'reviews' 
                ? 'text-yellow-500 border-yellow-500' 
                : 'text-gray-600 border-transparent hover:text-yellow-500'
              }`}
            >
              Reviews ({product.numReviews})
            </button>
          </div>
        </div>

        <div className="prose max-w-none min-h-[200px]">
          {activeTab === 'description' && (
            <div className="animate-fade-in">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Features:</h4>
                  <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
                    <li>Premium quality {product.category} product</li>
                    <li>Ergonomic and modern design</li>
                    <li>Highly durable materials</li>
                    <li>Official {product.brand} warranty included</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Brand", value: product.brand },
                  { label: "Category", value: product.category },
                  { label: "Model Number", value: `SN-${product._id?.substring(0, 8).toUpperCase()}` },
                  { label: "Material", value: "Premium Composite" },
                  { label: "Weight", value: "850g" },
                  { label: "Dimensions", value: "24 x 18 x 5 cm" },
                  { label: "Origin", value: "India" }
                ].map((spec, i) => (
                  <div key={i} className="flex border-b border-gray-100 py-3">
                    <span className="w-1/3 text-gray-500 font-medium">{spec.label}</span>
                    <span className="w-2/3 text-gray-800">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
                <div className="text-center md:text-left">
                  <div className="text-5xl font-bold text-gray-800 mb-2">{product.rating}</div>
                  <Rating value={product.rating} text={`${product.numReviews} Global Ratings`} size="text-lg" />
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(stars => {
                    const percent = stars === 5 ? 75 : stars === 4 ? 15 : 5;
                    return (
                      <div key={stars} className="flex items-center gap-4 text-sm">
                        <span className="w-12">{stars} star</span>
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="w-10 text-gray-500">{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {[
                { name: "Rahul S.", date: "March 15, 2024", rating: 5, comment: "Absolutely incredible! Exceeded all my expectations. The quality is top-notch." },
                { name: "Priya M.", date: "February 28, 2024", rating: 4, comment: "Very good product. Delivery was fast and the packaging was robust. Highly recommended." },
                { name: "Anish K.", date: "January 12, 2024", rating: 5, comment: "Best in class. Worth every rupee." }
              ].map((rev, i) => (
                <div key={i} className="border-b border-gray-50 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                      {rev.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{rev.name}</div>
                      <div className="text-xs text-gray-400">{rev.date}</div>
                    </div>
                  </div>
                  <Rating value={rev.rating} size="text-xs" />
                  <p className="mt-2 text-gray-600 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Similar Products */}
      <RecommendationsSection
        type="similar"
        productId={id}
        title="Smart Similar Products"
      />

    </div>
  );
};

export default ProductDetails;