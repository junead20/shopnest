// client/src/components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FaShoppingCart,
  FaSearch,
  FaHeart,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
  FaBox,
  FaStar,
  FaMapMarkerAlt,
  FaAngleDown,
  FaUsers
} from 'react-icons/fa';
import { logout } from '../store/slices/authSlice';
import { fetchWishlist, resetWishlist } from '../store/slices/wishlistSlice';
import { clearCart } from '../store/slices/cartSlice';

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { activeGroupToken, activeGroupName } = useSelector((state) => state.group);

  const cartItemsCount = cartItems?.reduce((acc, item) => acc + item.qty, 0) || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const categories = [
    'Electronics', 'Fashion', 'Home & Kitchen', 'Books',
    'Sports', 'Toys & Games'
  ];



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch wishlist when user logs in
  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(resetWishlist());
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="sticky top-0 z-50">
      {/* Main Navigation Bar - Amazon Style (Single Header) */}
      <nav className="bg-[#131921] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-white mr-4 flex-shrink-0">
              Shop<span className="text-yellow-500">Nest</span>
            </Link>

            {/* Location - India */}
            <div className="hidden lg:flex items-center text-sm mr-4">
              <FaMapMarkerAlt className="mr-1 text-gray-300" />
              <div>
                <p className="text-gray-300 text-xs">Deliver to</p>
                <p className="font-bold text-white">India</p>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="hidden lg:block">
              <select
                className="h-10 px-3 bg-gray-200 text-black rounded-l-md text-sm border-r focus:outline-none cursor-pointer"
                onChange={(e) => {
                  if (e.target.value) {
                    navigate(`/category/${e.target.value}`);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>All</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ShopNest"
                className="flex-1 px-4 py-2 text-black focus:outline-none"
              />
              <button
                type="submit"
                className="bg-yellow-500 px-6 py-2 rounded-r-md hover:bg-yellow-600 transition-colors"
              >
                <FaSearch className="text-white" />
              </button>
            </form>

            {/* Right Side Icons */}
            <div className="hidden lg:flex items-center space-x-6 ml-auto">
              {/* Account & Lists */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-1 text-white hover:text-yellow-500 text-sm"
                >
                  <FaUserCircle size={24} />
                  <div className="text-left">
                    <p className="text-gray-300 text-xs">Hello, {user ? user.name : 'Sign in'}</p>
                    <p className="font-bold text-sm flex items-center">
                      Account & Lists
                      <FaAngleDown className="ml-1 text-xs" />
                    </p>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl py-2 z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b">
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>

                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FaUserCircle className="mr-3" /> Profile
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FaBox className="mr-3" /> Orders
                        </Link>
                        <Link
                          to="/my-groups"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FaUsers className="mr-3" /> My Groups
                        </Link>
                        <Link
                          to="/wishlist"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <FaHeart className="mr-3" /> Wishlist
                        </Link>
                        {user.isAdmin && (
                          <>
                            <div className="border-t my-2"></div>
                            <Link
                              to="/admin"
                              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <FaStar className="mr-3 text-yellow-500" /> Admin Dashboard
                            </Link>
                          </>
                        )}
                        <div className="border-t my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                        >
                          <FaSignOutAlt className="mr-3" /> Logout
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-3">
                        <Link
                          to="/login"
                          className="block w-full text-center bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 mb-2"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Sign in
                        </Link>
                        <Link to="/deals" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>Today's Deals</Link>
                        <Link to="/customer-service" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>Customer Service</Link>
                        <p className="text-sm text-center text-gray-600 mt-2">
                          New customer?{' '}
                          <Link to="/register" className="text-yellow-600 hover:text-yellow-700" onClick={() => setIsDropdownOpen(false)}>
                            Start here
                          </Link>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative group">
                <FaHeart size={24} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
                <span className="text-xs block mt-1">Wishlist</span>
              </Link>

              {/* Group Shopping */}
              {activeGroupToken && (
                <Link to={`/group-shop/${activeGroupToken}`} className="flex flex-col items-center group relative">
                  <div className="bg-yellow-500 p-1.5 rounded-lg text-white group-hover:bg-yellow-600 transition-colors animate-pulse">
                    <FaUsers size={16} />
                  </div>
                  <span className="text-[10px] block mt-0.5 text-yellow-500 font-bold uppercase truncate w-16 text-center">
                    {activeGroupName || 'Active'}
                  </span>
                </Link>
              )}

              {/* Cart */}
              <Link to="/cart" className="relative group">
                <FaShoppingCart size={24} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
                <span className="text-xs block mt-1">Cart</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-white ml-auto"
            >
              <FaBars size={24} />
            </button>
          </div>

          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="lg:hidden pb-3">
            <div className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ShopNest"
                className="w-full px-4 py-2 text-black rounded-l-md focus:outline-none"
              />
              <button
                type="submit"
                className="bg-yellow-500 px-6 py-2 rounded-r-md hover:bg-yellow-600"
              >
                <FaSearch className="text-white" />
              </button>
            </div>
          </form>
        </div>
      </nav>

      {/* Category Navigation Bar - Separate Row */}
      <div className="bg-[#232F3E] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-10 text-sm overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center space-x-1 hover:text-yellow-500 px-2 py-1 lg:hidden"
            >
              <FaBars className="mr-1" />
              <span className="font-bold">All</span>
            </button>

            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat}
                to={`/category/${encodeURIComponent(cat)}`}
                className="hover:text-yellow-500 px-3 py-1"
              >
                {cat}
              </Link>
            ))}

            <Link to="/deals" className="hover:text-yellow-500 px-3 py-1 text-yellow-400 font-semibold">
              Today's Deals
            </Link>
            <Link to="/group-shop" className="hover:text-yellow-500 px-3 py-1 text-purple-400 font-bold flex items-center gap-1">
              <FaUsers className="text-sm" /> Group Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
            <div className="p-4 bg-[#232F3E] text-white">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">ShopNest</span>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <FaTimes />
                </button>
              </div>
              {user ? (
                <div className="mt-2">
                  <p className="text-sm">Hello, {user.name}</p>
                </div>
              ) : (
                <div className="mt-2">
                  <Link
                    to="/login"
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg inline-block"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold mb-2">Shop by Category</h3>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/category/${encodeURIComponent(cat)}`}
                  className="block py-2 hover:bg-gray-100 px-2 rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat}
                </Link>
              ))}

              <div className="border-t my-4"></div>

              <h3 className="font-bold mb-2">Today's Deals</h3>
              <Link
                to="/deals"
                className="block py-2 hover:bg-gray-100 px-2 rounded"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🔥 Today's Deals
              </Link>

              {user && (
                <>
                  <div className="border-t my-4"></div>
                  <h3 className="font-bold mb-2">Your Account</h3>
                  <Link
                    to="/profile"
                    className="block py-2 hover:bg-gray-100 px-2 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    className="block py-2 hover:bg-gray-100 px-2 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    to="/my-groups"
                    className="block py-2 hover:bg-gray-100 px-2 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Groups
                  </Link>
                  <Link
                    to="/wishlist"
                    className="block py-2 hover:bg-gray-100 px-2 rounded"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Wishlist
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;