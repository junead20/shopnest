// client/src/pages/Cart.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaArrowLeft, FaUsers, FaArrowRight, FaPlus } from 'react-icons/fa';
import { removeFromCart, updateQuantity } from '../store/slices/cartSlice';
import ProductImage from '../components/ProductImage';
import { formatINR } from '../utils/currency';
import api from '../services/api';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { activeGroupToken, activeGroupName } = useSelector((state) => state.group);
  const [userGroups, setUserGroups] = React.useState([]);
  const [joinToken, setJoinToken] = React.useState('');

  React.useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      const { data } = await api.get('/group-cart/user/my-groups');
      setUserGroups(data);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const shipping = subtotal > 500 ? 0 : 40;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/shipping');
    }
  };

  const EmptyCart = () => (
    <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
      <h2 className="text-2xl font-bold text-gray-600 mb-4">Your cart is empty</h2>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 font-bold"
      >
        <FaArrowLeft />
        Continue Shopping
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {/* Group Shopping Entry Point */}
      {user && userGroups.length > 0 && (
        <div className="mb-10 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-yellow-200">
              <FaUsers />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Shopping Together?</h2>
              <p className="text-gray-600 max-w-md">Share a cart with friends, vote on products, and unlock a 7% Team Discount!</p>
            </div>
          </div>
          
          <div className="flex gap-3 shrink-0">
            {activeGroupToken ? (
              <div className="flex gap-2">
                <Link 
                  to={`/group-shop/${activeGroupToken}`}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md"
                >
                  Resume {activeGroupName} <FaArrowRight text-sm />
                </Link>
                <Link 
                  to="/group-shop"
                  className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-xl font-bold flex items-center hover:bg-gray-50 transition-all shadow-sm"
                >
                  <FaPlus className="mr-2" /> New
                </Link>
              </div>
            ) : (
              <Link 
                to="/group-shop"
                className="bg-yellow-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-600 transition-all shadow-md shadow-yellow-100"
              >
                Start Group Session
              </Link>
            )}

            <div className="flex bg-white/50 backdrop-blur rounded-xl border border-yellow-200 overflow-hidden shadow-inner">
                <input 
                    type="text"
                    value={joinToken}
                    onChange={(e) => setJoinToken(e.target.value)}
                    placeholder="Enter Code"
                    className="bg-transparent px-4 py-2 text-sm outline-none w-28 focus:bg-white transition-all"
                />
                <button 
                    onClick={() => {
                        const code = joinToken.includes('/group-shop/') ? joinToken.split('/group-shop/').pop() : joinToken;
                        if (code) navigate(`/group-shop/${code}`);
                    }}
                    className="bg-gray-900 text-white px-4 py-2 text-sm font-bold hover:bg-black transition-all"
                >
                    Join
                </button>
            </div>
          </div>
        </div>
      )}

      {userGroups.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700">
              <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
              Your Group Sessions
            </h3>
            <Link to="/my-groups" className="text-sm font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-3 py-1 rounded-lg">View All Dashboard</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {userGroups.map(group => (
              <Link
                key={group.shareToken}
                to={`/group-shop/${group.shareToken}`}
                className={`snap-start shrink-0 bg-white border ${activeGroupToken === group.shareToken ? 'border-yellow-400 shadow-md bg-yellow-50/30' : 'border-gray-200'} p-4 rounded-2xl w-[220px] hover:shadow-md hover:border-yellow-200 transition-all flex items-center gap-3`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${activeGroupToken === group.shareToken ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-600'}`}>
                  {group.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate text-gray-900">{group.name}</div>
                  <div className="text-[10px] text-gray-500 flex justify-between uppercase font-bold tracking-wider mt-1">
                    <span>{group.status}</span>
                    <span className="text-gray-400">{group.members.length} <FaUsers className="inline pb-0.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {cartItems.length === 0 ? <EmptyCart /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.map((item) => (
              <div
                key={item.product}
                className="flex items-center gap-4 border-b py-4"
              >
                <ProductImage
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-contain"
                />
                
                <div className="flex-1">
                  <Link
                    to={`/product/${item.product}`}
                    className="text-lg font-bold hover:text-yellow-600"
                  >
                    {item.name}
                  </Link>
                  <div className="font-bold text-gray-900 mt-1">
                    {formatINR(item.price)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={item.qty}
                    onChange={(e) =>
                      dispatch(
                        updateQuantity({
                          id: item.product,
                          qty: Number(e.target.value),
                        })
                      )
                    }
                    className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {[...Array(item.countInStock || 10).keys()].map((x) => (
                      <option key={x + 1} value={x + 1}>
                        {x + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => dispatch(removeFromCart(item.product))}
                    className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 p-6 rounded-2xl h-fit border border-gray-100">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.qty, 0)} items)</span>
                <span className="font-bold text-gray-900">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-bold text-gray-900">
                  {shipping === 0 ? <span className="text-green-600">Free</span> : formatINR(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 pb-4 border-b">
                <span>Estimated Tax (18%)</span>
                <span className="font-bold text-gray-900">{formatINR(tax)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-yellow-500 text-white py-4 rounded-xl font-bold hover:bg-yellow-600 transition-colors shadow-lg shadow-yellow-100 flex items-center justify-center gap-2"
            >
              Proceed to Checkout <FaArrowRight />
            </button>
            
            {shipping > 0 && (
              <p className="text-sm text-center text-gray-500 mt-4">
                Add {formatINR(500 - subtotal)} more to your cart for free shipping!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;