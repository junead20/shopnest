import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaMagic, FaStar, FaRegStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import api from '../services/api';
import { formatINRSimple } from '../utils/currency';
import { addToCart } from '../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, fetchWishlist } from '../store/slices/wishlistSlice';
import { useToast } from '../context/ToastContext';

const RecommendationsSection = ({ type = 'personalized', productId = null, title = 'Handpicked For Your Style' }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();
    const { showToast } = useToast();
    const { user } = useSelector((state) => state.auth);
    const { items: wishlistItems } = useSelector((state) => state.wishlist);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                setLoading(true);
                let endpoint = '/recommendations/personalized';

                if (type === 'similar' && productId) {
                    endpoint = `/recommendations/similar/${productId}`;
                }

                const { data } = await api.get(endpoint);
                console.log(`✨ AI Recommendations (${type}) fetched:`, data.length, 'items found');
                setProducts(data);
                setLoading(false);
            } catch (error) {
                console.error('❌ AI Recommendations Error:', error);
                setProducts([]);
                setLoading(false);
            }
        };

        if (type === 'personalized' && !user) {
            setLoading(false);
            return;
        }

        fetchRecommendations();
    }, [type, productId, user]);

    const handleAddToCart = (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart({
            product: product._id,
            name: product.name,
            price: product.price,
            image: product.imageUrl,
            qty: 1,
        }));
        showToast('I’ve successfully added that piece to your cart!', 'magic');
    };

    const handleWishlistToggle = async (product, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            showToast('Please login to curate items in your wishlist.', 'info');
            return;
        }
        const isInWishlist = wishlistItems?.some(item => (item.product?._id || item.product) === product._id);
        if (isInWishlist) {
            await dispatch(removeFromWishlist(product._id)).unwrap();
        } else {
            await dispatch(addToWishlist(product._id)).unwrap();
        }
        dispatch(fetchWishlist());
    };

    const isProductInWishlist = (productId) => {
        return wishlistItems?.some(item => (item.product?._id || item.product) === productId);
    };

    if (loading) {
        return (
            <div className="py-8">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <div className="py-10 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
                        <FaMagic className="text-white text-xl animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                        <p className="text-sm text-indigo-600 font-bold italic">Curated by your AI Stylist ✨</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                    <div key={product._id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-indigo-100 overflow-hidden flex flex-col h-full relative">

                        <button
                            onClick={(e) => handleWishlistToggle(product, e)}
                            className="absolute top-3 right-3 z-10 p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            {isProductInWishlist(product._id) ? (
                                <FaHeart className="text-red-500" />
                            ) : (
                                <FaRegHeart className="text-gray-400 hover:text-red-500" />
                            )}
                        </button>

                        <Link to={`/product/${product._id}`} className="block h-56 p-6 bg-gray-50/50 group-hover:bg-white transition-colors duration-300">
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                            />
                        </Link>

                        <div className="p-5 flex flex-col flex-grow">
                            <div className="mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{product.category}</span>
                            </div>
                            <Link to={`/product/${product._id}`} className="block mb-2">
                                <h3 className="font-bold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight">
                                    {product.name}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-1 mb-2">
                                <div className="flex text-yellow-400 text-xs">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        i < Math.floor(product.rating) ? <FaStar key={i} /> : <FaRegStar key={i} />
                                    ))}
                                </div>
                                <span className="text-[11px] text-gray-400 font-medium">({product.numReviews})</span>
                            </div>

                            <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 relative overflow-hidden group/ai min-h-[100px] flex flex-col justify-center">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FaMagic className="text-indigo-600 text-[10px]" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">A Stylist's Note</span>
                                </div>
                                <p className="text-[12px] font-medium text-slate-700 leading-relaxed italic tracking-wide">
                                    "{product.aiReason || "I've specially selected this piece for you, thinking it perfectly complements your unique style."}"
                                </p>
                            </div>

                            <div className="mt-auto flex items-center justify-between">
                                <div>
                                    <span className="text-2xl font-black text-gray-900">{formatINRSimple(product.price)}</span>
                                </div>
                                <button
                                    onClick={(e) => handleAddToCart(product, e)}
                                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transform hover:-translate-y-0.5 transition-all shadow-md hover:shadow-indigo-200"
                                >
                                    Explore Piece
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationsSection;
