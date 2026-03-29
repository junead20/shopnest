// client/src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaMapMarkerAlt, FaQrcode, FaShieldAlt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { formatINR } from '../utils/currency';

const Checkout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);
    const { cartItems, shippingAddress } = useSelector((state) => state.cart);

    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const [orderId] = useState(`SN${Math.floor(Math.random() * 900000) + 100000}`);

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

    // UPI Configuration
    const UPI_ID = "juneadbaba61@okhdfcbank";
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=ShopNest&am=${total.toFixed(2)}&cu=INR&tn=Order_${orderId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;

    const handleConfirmPayment = async () => {
        try {
            setVerifying(true);
            setError(null);

            // Simulate a "Secure Connection to Bank" delay for 3 seconds as requested
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Create order on backend
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
                paymentMethod: 'Direct UPI QR',
                itemsPrice: subtotal,
                taxPrice: tax,
                shippingPrice: shipping,
                totalPrice: total,
                isPaid: true,
                paymentResult: {
                    id: orderId,
                    status: 'Paid (Direct UPI)',
                    update_time: new Date().toISOString(),
                    email_address: user.email,
                    manual_vpa: UPI_ID
                }
            };

            const order = await dispatch(createOrder(orderData)).unwrap();
            
            // Success! Clear cart and navigate
            dispatch(clearCart());
            setVerifying(false);
            
            // Critical: Scroll to top before navigation for better visibility
            window.scrollTo(0, 0);
            
            if (order && order._id) {
                navigate(`/order-success/${order._id}`, { replace: true });
            } else {
                navigate('/orders');
            }

        } catch (err) {
            console.error('Checkout Error:', err);
            setError("Could not complete order. Please try again.");
            setVerifying(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-yellow-500 rounded-2xl shadow-xl transform hover:rotate-12 transition-transform">
                    <FaQrcode className="text-white text-3xl" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Fast QR Checkout</h1>
                    <p className="text-gray-400 font-medium">Bypass KYC • Direct Bank Transfer</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column: Summary */}
                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <FaTruck className="text-yellow-500" /> Order Summary
                        </h2>

                        <div className="space-y-4 mb-8">
                            {cartItems.map(item => (
                                <div key={item.product} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 p-2 group-hover:scale-110 transition-transform">
                                            <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 leading-tight">{item.name}</p>
                                            <p className="text-sm text-gray-400 font-medium tracking-wide">QTY: {item.qty}</p>
                                        </div>
                                    </div>
                                    <span className="font-black text-gray-700">{formatINR(item.price * item.qty)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                            <div className="flex justify-between text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                <span>Cart Subtotal</span>
                                <span>{formatINR(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                <span>Shipping Fee</span>
                                <span>{shipping === 0 ? <span className="text-green-600">FREE</span> : formatINR(shipping)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                                <span>GST (Flat 18%)</span>
                                <span>{formatINR(tax)}</span>
                            </div>
                            <div className="border-t-2 border-dashed border-gray-200 pt-4 mt-2 flex justify-between items-end">
                                <span className="text-gray-900 font-black text-2xl">Payable Total</span>
                                <span className="text-4xl font-black text-yellow-600 tracking-tighter shadow-yellow-100">{formatINR(total)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 relative z-10">
                            <FaMapMarkerAlt className="text-yellow-400" /> Deliver To
                        </h2>
                        <div className="relative z-10 space-y-1 text-indigo-50">
                            <p className="text-2xl font-black text-white">{shippingAddress.fullName}</p>
                            <p className="opacity-80 font-medium">{shippingAddress.address}</p>
                            <p className="opacity-80 font-bold tracking-tight">{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zipCode}</p>
                            <p className="pt-3 flex items-center gap-3">
                                <span className="w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
                                <span className="font-black text-white">Call: {shippingAddress.phoneNumber}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: QR Interaction */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-10 rounded-[40px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] border-4 border-yellow-500 relative flex flex-col items-center">
                        <div className="bg-yellow-500 text-white px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-widest absolute -top-5 shadow-2xl shadow-yellow-200 border-2 border-white">
                            Scan with Any UPI App
                        </div>

                        {verifying ? (
                            <div className="text-center py-20 animate-pulse">
                                <FaSpinner className="text-7xl text-yellow-500 animate-spin mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-gray-900">Verifying Payment...</h3>
                                <p className="text-gray-400 font-bold mt-2">Connecting to Secure Banking Network</p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Direct Scan & Pay</h3>
                                    <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Immediate Confirmation</p>
                                </div>

                                <div className="relative p-6 bg-white rounded-3xl shadow-inner border border-gray-100 group mb-8">
                                    <div className="absolute inset-0 bg-yellow-500 opacity-0 group-hover:opacity-5 transition-opacity rounded-3xl"></div>
                                    <img 
                                        src={qrCodeUrl} 
                                        alt="UPI QR Code" 
                                        className="w-56 h-56 object-contain pointer-events-none"
                                    />
                                    <div className="mt-4 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">UPI ID: {UPI_ID}</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="w-full mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3 border border-red-100">
                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                                        {error}
                                    </div>
                                )}

                                <div className="w-full space-y-4">
                                    <button
                                        onClick={handleConfirmPayment}
                                        className="w-full py-6 rounded-[30px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black text-2xl shadow-2xl shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                                    >
                                        <FaCheckCircle className="text-3xl" />
                                        I Have Paid
                                    </button>
                                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest px-8 leading-relaxed">
                                        Scan the QR above, complete the payment in your app, then click "I Have Paid" for instant confirmation.
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="mt-10 flex items-center gap-6 opacity-30 cursor-default">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-5" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Google_Pay_Logo.svg" alt="GPay" className="h-5" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" className="h-4" />
                        </div>
                    </div>

                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex items-center gap-5">
                        <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <FaShieldAlt className="text-green-500 text-2xl" />
                        </div>
                        <div>
                            <h4 className="font-black text-gray-800 text-sm">Instant Order Success</h4>
                            <p className="text-[11px] text-gray-400 font-bold leading-snug">Orders paid via Direct QR are processed faster with zero KYC delays.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;