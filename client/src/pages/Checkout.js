// client/src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaMapMarkerAlt, FaQrcode, FaShieldAlt } from 'react-icons/fa';
import api from '../services/api';
import { createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { formatINR } from '../utils/currency';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    } else if (!shippingAddress.address) {
      navigate('/shipping');
    }
  }, [user, cartItems, shippingAddress, navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 500 ? 0 : 40;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create order on backend to get razorpay_order_id
      const { data: orderConfig } = await api.post('/payment/razorpay/order', {
        amount: total,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_mock', // Enter the Key ID generated from the Dashboard
        amount: orderConfig.amount,
        currency: orderConfig.currency,
        name: "ShopNest QR Checkout",
        description: `Order for ${user.name}`,
        image: "/logo.png",
        order_id: orderConfig.id,
        handler: async function (response) {
          try {
            // 3. Verify payment on backend
            const { data } = await api.post('/payment/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (data.success) {
              // 4. Create local order and clear cart
              const orderData = {
                orderItems: cartItems.map(item => ({
                  name: item.name,
                  qty: item.qty,
                  price: item.price,
                  product: item.product,
                  image: item.image
                })),
                shippingAddress: {
                  fullName: shippingAddress.fullName,
                  address: shippingAddress.address,
                  city: shippingAddress.city,
                  state: shippingAddress.state,
                  zipCode: shippingAddress.zipCode,
                  country: shippingAddress.country,
                  phoneNumber: shippingAddress.phoneNumber
                },
                paymentMethod: 'Razorpay UPI/QR',
                itemsPrice: subtotal,
                taxPrice: tax,
                shippingPrice: shipping,
                totalPrice: total,
                paymentResult: {
                  id: response.razorpay_payment_id,
                  status: 'Paid',
                  update_time: Date.now(),
                  email_address: user.email
                }
              };

              const order = await dispatch(createOrder(orderData)).unwrap();
              dispatch(clearCart());
              navigate(`/order-success/${order._id}`);
            }
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
            setLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: shippingAddress.phoneNumber
        },
        notes: {
          address: shippingAddress.address
        },
        theme: {
          color: "#eab308" // ShopNest Yellow
        },
        // IMPORTANT: Set to show ONLY QR code/UPI methods
        config: {
          display: {
            blocks: {
              upi: {
                name: 'UPI QR / Apps',
                instruments: [
                  {
                    method: 'upi'
                  }
                ]
              }
            },
            sequence: ['block.upi'],
            preferences: {
              show_default_blocks: false
            }
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      
      rzp1.on('payment.failed', function (response) {
        setError(response.error.description);
        setLoading(false);
      });

      rzp1.open();
    } catch (err) {
      setError("Could not initiate payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-yellow-500 rounded-2xl shadow-lg">
              <FaQrcode className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">QR Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Summary */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FaTruck className="text-yellow-500" /> Order Summary
            </h2>
            
            <div className="space-y-4 mb-8">
              {cartItems.map(item => (
                <div key={item.product} className="flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 p-2">
                        <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 leading-tight">{item.name}</p>
                        <p className="text-sm text-gray-400 font-medium">Qty: {item.qty}</p>
                      </div>
                  </div>
                  <span className="font-bold text-gray-700">{formatINR(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl space-y-3">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium tracking-wide">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-600 font-bold uppercase text-xs">Free</span> : formatINR(shipping)}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>GST (18%)</span>
                <span>{formatINR(tax)}</span>
              </div>
              <div className="border-t pt-4 mt-2 flex justify-between items-end">
                <span className="text-gray-900 font-black text-xl">Grand Total</span>
                <span className="text-3xl font-black text-yellow-600 tracking-tighter">{formatINR(total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10">
                <FaMapMarkerAlt className="text-yellow-400" /> Shipping Destination
              </h2>
              <div className="relative z-10 space-y-1 text-indigo-50">
                <p className="text-xl font-bold text-white">{shippingAddress.fullName}</p>
                <p className="opacity-80">{shippingAddress.address}</p>
                <p className="opacity-80 font-medium">{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zipCode}</p>
                <p className="pt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    Phone: {shippingAddress.phoneNumber}
                </p>
              </div>
          </div>
        </div>

        {/* Right Column: Payment Interaction */}
        <div className="flex flex-col gap-6">
            <div className="bg-white p-10 rounded-3xl shadow-2xl border-4 border-yellow-500 relative flex flex-col items-center">
                <div className="bg-yellow-500 text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest absolute -top-4 shadow-lg shadow-yellow-200">
                    Trusted Payment by Razorpay
                </div>
                
                <div className="text-center space-y-4 mb-8">
                    <div className="w-24 h-24 bg-yellow-50 rounded-full mx-auto flex items-center justify-center mb-6 ring-8 ring-yellow-50/50">
                        <FaQrcode className="text-yellow-500 text-5xl" />
                    </div>
                    <h3 className="text-3xl font-black text-gray-900">Scan to Pay</h3>
                    <p className="text-gray-400 font-medium max-w-xs mx-auto">
                        Quickly pay using any UPI app like <span className="text-indigo-600">GPay</span>, <span className="text-purple-600">PhonePe</span>, or <span className="text-blue-600">Paytm</span>.
                    </p>
                </div>

                {error && (
                  <div className="w-full mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-shake">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className={`w-full py-6 rounded-3xl text-white font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    loading 
                    ? 'bg-gray-200 cursor-not-allowed text-gray-400' 
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:scale-[1.03] active:scale-95 shadow-yellow-200'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-7 w-7 border-4 border-white/30 border-t-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Generate Payment QR
                    </>
                  )}
                </button>

                <div className="mt-8 flex items-center gap-4 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Google_Pay_Logo.svg" alt="Google Pay" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4" />
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    <FaShieldAlt className="text-green-500 text-xl" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-800">Secure AES-256 Encryption</h4>
                    <p className="text-xs text-gray-400 font-medium tracking-tight">Your payment is processed through Razorpay's PCI-DSS compliant servers.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;