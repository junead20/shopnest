// client/src/pages/GroupShopping.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaUsers, FaShareAlt, FaThumbsUp, FaThumbsDown, FaInfoCircle, FaCheckCircle, FaTruck } from 'react-icons/fa';
import { io } from 'socket.io-client';
import api from '../services/api';
import { formatINRSimple } from '../utils/currency';
import { setActiveGroup } from '../store/slices/groupSlice';

const GroupShopping = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { activeGroupName } = useSelector((state) => state.group);
    
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('');
    const [copied, setCopied] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '', address: '', city: '', state: '', zipCode: '', phoneNumber: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
    const [notification, setNotification] = useState(null);
    const [joinToken, setJoinToken] = useState('');

    const fetchGroup = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/group-cart/${token}`);
            setGroup(data);
            dispatch(setActiveGroup({ token: data.shareToken, name: data.name }));
        } catch (error) {
            console.error('Error fetching group:', error);
            alert('Failed to load group. Link might be invalid.');
            navigate('/group-shop');
        } finally {
            setLoading(false);
        }
    }, [token, dispatch, navigate]);

    useEffect(() => {
        const SOCKET_URL = process.env.REACT_APP_API_URL 
            ? process.env.REACT_APP_API_URL.replace('/api', '') 
            : 'http://localhost:5000';
            
        const newSocket = io(SOCKET_URL);

        if (token) {
            newSocket.emit('joinGroup', token);
        }

        newSocket.on('cartUpdated', (data) => {
            console.log('🔄 Real-time update received:', data);
            
            // Show notification
            let msg = 'Cart updated!';
            if (data.type === 'itemAdded') msg = 'A new item was added!';
            if (data.type === 'voteCast') msg = 'A vote was cast!';
            if (data.type === 'memberJoined') msg = `${data.user} joined the group!`;
            if (data.type === 'cartLocked') msg = 'The cart has been LOCKED by admin. 🔒';
            if (data.type === 'cartUnlocked') msg = 'The cart has been UNLOCKED! 🛒';

            setNotification(msg);
            setTimeout(() => setNotification(null), 4000);

            fetchGroup();
        });

        return () => newSocket.close();
    }, [token, fetchGroup]);

    useEffect(() => {
        if (token && user) {
            fetchGroup();
        } else if (!token) {
            setLoading(false);
        }
    }, [token, user, fetchGroup]);



    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/group-cart/create', { name: groupName });
            navigate(`/group-shop/${data.shareToken}`);
        } catch (error) {
            console.error('Error creating group:', error);
            const msg = typeof error === 'string' ? error : (error.message || error.error || JSON.stringify(error));
            alert(`Error creating group: ${msg}`);
        }
    };

    const handleLockCart = async () => {
        if (!window.confirm('Locking the cart prevents further additions or voting. Ready?')) return;
        try {
            await api.put('/group-cart/lock', { token });
        } catch (error) {
            alert(`Error locking cart: ${error.message || 'Unknown error'}`);
        }
    };

    const handleUnlockCart = async () => {
        try {
            await api.put('/group-cart/unlock', { token });
        } catch (error) {
            console.error('Unlock error:', error);
            const msg = typeof error === 'string' ? error : (error.message || error.error || JSON.stringify(error));
            alert(`Error unlocking cart: ${msg}`);
        }
    };

    const handleJoinGroup = async () => {
        try {
            await api.post(`/group-cart/join/${token}`);
            fetchGroup();
        } catch (error) {
            alert('Error joining group');
        }
    };

    const handleVote = async (productId, vote) => {
        if (group?.status === 'locked') return alert('Cart is locked for checkout!');
        try {
            await api.put('/group-cart/vote', { token, productId, vote });
            fetchGroup();
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const handlePlaceOrder = async () => {
        if (!shippingInfo.fullName || !shippingInfo.address || !shippingInfo.phoneNumber) {
            return alert('Please fill in all shipping details.');
        }

        try {
            setPlacingOrder(true);
            const { data } = await api.post('/group-cart/place-order', {
                token,
                shippingAddress: {
                    ...shippingInfo,
                    country: 'India'
                },
                paymentMethod
            });
            alert('Order placed successfully!');
            navigate(`/order-success/${data._id}`);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setPlacingOrder(false);
        }
    };

    const handleReady = async () => {
        if (group?.status === 'locked') return;
        try {
            await api.put('/group-cart/ready', { token });
            fetchGroup();
        } catch (error) {
            console.error('Error updating ready status:', error);
        }
    };

    const copyInviteLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-500">Loading your Group Shop...</div>;

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-3xl font-bold mb-4">Social Shopping</h1>
                <p className="text-gray-600 mb-8">Please login to create or join a shared shopping session.</p>
                <button onClick={() => navigate('/login')} className="bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold">Login to Continue</button>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500 text-4xl mb-6 mx-auto">
                        <FaUsers />
                    </div>
                    <h1 className="text-3xl font-bold text-center mb-2">Shop Together</h1>
                    <p className="text-center text-gray-500 mb-8">Create a shared link, invite friends, vote on products, and get team discounts!</p>
                    
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name (e.g., Roommates, Party Essentials)</label>
                            <input 
                                type="text" 
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                                placeholder="Group Name"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-yellow-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100">
                            Start Shopping Together
                        </button>
                    </form>

                    <div className="relative my-8 text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">OR</span>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-semibold text-gray-700 text-center">Join with a Code or Link</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={joinToken}
                                onChange={(e) => setJoinToken(e.target.value)}
                                className="flex-1 px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none transition-all"
                                placeholder="Paste code or link here..."
                            />
                            <button 
                                onClick={() => {
                                    const code = joinToken.includes('/group-shop/') ? joinToken.split('/group-shop/').pop() : joinToken;
                                    if (code) navigate(`/group-shop/${code}`);
                                }}
                                className="bg-gray-900 text-white px-6 rounded-xl font-bold hover:bg-black transition-all"
                            >
                                Join
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isMember = group?.members.some(m => m.user?._id === user._id);
    const totalPrice = group?.items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0) || 0;
    const discount = (totalPrice * (group?.discountAmount || 0)) / 100;
    const finalPrice = totalPrice - discount;

    return (
        <div className="min-h-screen bg-white">
            {notification && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-yellow-500 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        {notification}
                    </div>
                </div>
            )}
            {/* Floating Share Link */}
            <div className="fixed bottom-8 right-8 z-40">
                <button 
                    onClick={copyInviteLink}
                    className={`flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white shadow-yellow-200 hover:bg-yellow-600'}`}
                >
                    <FaShareAlt size={20} />
                    <span className="font-bold">{copied ? 'Link Copied!' : 'Invite Friends'}</span>
                </button>
            </div>

            <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">{group?.name}</h1>
                                <p className="text-gray-500 flex items-center gap-2">
                                    <FaUsers className="text-yellow-500" /> {group?.members.length} Shopping Member(s)
                                </p>
                            </div>
                            <button 
                                onClick={copyInviteLink}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${copied ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-100 hover:border-yellow-200 text-gray-600'}`}
                            >
                                {copied ? <><FaCheckCircle /> Copied!</> : <><FaShareAlt /> Share Link</>}
                            </button>
                        </div>

                        {!isMember && (
                            <div className="bg-yellow-50 p-4 rounded-2xl mb-6 flex items-center justify-between border border-yellow-100">
                                <p className="text-yellow-800 font-medium">Join this shared cart to add items and vote on what to buy.</p>
                                <button onClick={handleJoinGroup} className="bg-yellow-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-yellow-600 transition-all">Join Group</button>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Shared Items</h2>
                            {group?.items.length === 0 ? (
                                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                                    No items in the cart yet. Start adding!
                                </div>
                            ) : (
                                group?.items.map((item) => (
                                    <div key={item._id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 items-center">
                                        <img src={item.product.imageUrl} alt={item.product.name} className="w-20 h-20 object-contain bg-white p-2 rounded-xl" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800">{item.product.name}</h3>
                                            <p className="text-sm text-gray-500">Added by {item.addedBy?.name || 'Unknown'} • Qty: {item.quantity}</p>
                                            <div className="text-lg font-bold text-gray-900">{formatINRSimple(item.product.price * item.quantity)}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex gap-2 bg-white rounded-full p-1 border border-gray-200">
                                                <button 
                                                    onClick={() => handleVote(item.product._id, 'up')}
                                                    className={`p-2 rounded-full transition-all ${item.votes.find(v => (v.user._id || v.user) === user._id && v.vote === 'up') ? 'bg-yellow-500 text-white' : 'hover:bg-gray-50 text-gray-400'}`}
                                                >
                                                    <FaThumbsUp />
                                                </button>
                                                <button 
                                                    onClick={() => handleVote(item.product._id, 'down')}
                                                    className={`p-2 rounded-full transition-all ${item.votes.find(v => (v.user._id || v.user) === user._id && v.vote === 'down') ? 'bg-red-500 text-white' : 'hover:bg-gray-50 text-gray-400'}`}
                                                >
                                                    <FaThumbsDown />
                                                </button>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                                                    {item.votes.filter(v => v.vote === 'up').length} Yes / {item.votes.filter(v => v.vote === 'down').length} No
                                                </span>
                                                <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
                                                    {item.votes.filter(v => v.vote === 'up').map(v => (
                                                        <span key={v.user._id || v.user} className="text-[8px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-bold">
                                                            {(v.user.name || 'User').split(' ')[0]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {group?.status === 'locked' && group?.admin === user._id && (
                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <FaTruck className="text-yellow-500" /> Final Checkout Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <input 
                                        type="text" placeholder="Full Name" 
                                        className="p-3 border rounded-xl"
                                        value={shippingInfo.fullName}
                                        onChange={(e) => setShippingInfo({...shippingInfo, fullName: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="Phone Number" 
                                        className="p-3 border rounded-xl"
                                        value={shippingInfo.phoneNumber}
                                        onChange={(e) => setShippingInfo({...shippingInfo, phoneNumber: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="Street Address" 
                                        className="p-3 border rounded-xl md:col-span-2"
                                        value={shippingInfo.address}
                                        onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="City" 
                                        className="p-3 border rounded-xl"
                                        value={shippingInfo.city}
                                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                                    />
                                    <input 
                                        type="text" placeholder="PIN Code" 
                                        className="p-3 border rounded-xl"
                                        value={shippingInfo.zipCode}
                                        onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                                    />
                                </div>
                                <div className="bg-gray-50 p-4 rounded-2xl mb-8">
                                    <label className="block text-sm font-bold mb-3">Payment Method</label>
                                    <div className="flex gap-4">
                                        {['Cash on Delivery', 'Stripe'].map(m => (
                                            <button 
                                                key={m}
                                                onClick={() => setPaymentMethod(m)}
                                                className={`px-6 py-2 rounded-xl border-2 transition-all ${paymentMethod === m ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6">
                    <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-xl sticky top-8">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                             Summary
                        </h2>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between opacity-70">
                                <span>Subtotal</span>
                                <span>{formatINRSimple(totalPrice)}</span>
                            </div>
                            {group?.discountAmount > 0 && (
                                <div className="flex justify-between text-green-400 font-bold">
                                    <span>Team Discount ({group.discountAmount}%)</span>
                                    <span>-{formatINRSimple(discount)}</span>
                                </div>
                            )}
                            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-2xl font-black">
                                <span>Total</span>
                                <span>{formatINRSimple(finalPrice)}</span>
                            </div>
                        </div>

                        {group?.members.length < 3 && group?.status === 'active' && (
                            <div className="bg-white/10 p-4 rounded-xl mb-6 text-sm flex gap-3">
                                <FaInfoCircle className="text-yellow-400 shrink-0 mt-1" />
                                <p>Invite <strong>{3 - group.members.length} more friend(s)</strong> to unlock the 7% Team Discount!</p>
                            </div>
                        )}

                        {!isMember ? null : group?.status === 'active' && (
                            <button 
                                onClick={handleReady}
                                className={`w-full py-3 rounded-xl font-bold mb-6 transition-all border-2 ${group?.members.find(m => m.user._id === user._id)?.ready ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
                            >
                                {group?.members.find(m => m.user._id === user._id)?.ready ? '✓ I\'m Ready' : 'Mark as Ready'}
                            </button>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">Split Breakdown</h3>
                            <div className="space-y-2">
                                {group?.members.map(member => {
                                    let memberTotal = 0;
                                    group?.items.forEach(i => {
                                        const yesVoters = i.votes.filter(v => v.vote === 'up');
                                        if (yesVoters.length > 0) {
                                            // Split cost among yes voters
                                            if (yesVoters.some(v => (v.user._id || v.user) === member.user?._id)) {
                                                memberTotal += (i.product.price * i.quantity) / yesVoters.length;
                                            }
                                        } else {
                                            // If no votes, the person who added it is responsible
                                            if ((i.addedBy?._id || i.addedBy) === member.user?._id) {
                                                memberTotal += i.product.price * i.quantity;
                                            }
                                        }
                                    });
                                    // Apply shared discount proportionally
                                    const memberDiscount = (memberTotal * (group.discountAmount || 0)) / 100;
                                    return (
                                        <div key={member.user?._id} className="bg-white/5 rounded-xl p-3 flex justify-between items-center text-xs">
                                            <span className="opacity-70">{member.user?.name}</span>
                                            <span className="font-bold text-yellow-400">{formatINRSimple(memberTotal - memberDiscount)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {group?.status === 'locked' && (
                                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 mb-6 mt-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-yellow-800 font-bold">Cart is Locked 🔒</p>
                                            <p className="text-sm text-yellow-600">Review final split and place order.</p>
                                        </div>
                                        {group.admin === user._id && (
                                            <button 
                                                onClick={handleUnlockCart}
                                                className="bg-white text-yellow-600 px-4 py-2 rounded-xl text-sm font-bold border border-yellow-200 hover:bg-yellow-100 transition-all"
                                            >
                                                Unlock to Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="bg-yellow-500/10 rounded-2xl p-4 mt-4 border border-yellow-500/20">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="opacity-70 italic">Total Team Savings:</span>
                                    <span className="font-black text-green-500">{formatINRSimple(discount)}</span>
                                </div>
                            </div>
                        </div>

                        {group?.admin === user._id && group?.status === 'active' && (
                            <button 
                                onClick={handleLockCart}
                                className="w-full border-2 border-yellow-500 text-yellow-500 py-3 rounded-2xl font-bold mt-6 hover:bg-yellow-500 hover:text-white transition-all"
                            >
                                Lock Cart for Order
                            </button>
                        )}
                        
                        {group?.members.some(m => !m.ready) && group?.status === 'locked' && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-xs font-bold flex gap-2 items-center border border-red-100 animate-pulse">
                                <FaInfoCircle /> Wait for all members to mark themselves as READY before placing the order.
                            </div>
                        )}
                        <button 
                            disabled={group?.status === 'active' || placingOrder || (group?.status === 'locked' && group?.members.some(m => !m.ready))}
                            onClick={handlePlaceOrder}
                            className={`w-full py-4 rounded-2xl font-black text-xl mt-4 transition-all shadow-lg ${group?.status === 'active' || placingOrder || (group?.status === 'locked' && group?.members.some(m => !m.ready)) ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-900/40'}`}
                        >
                            {placingOrder ? 'Processing...' : (group?.status === 'ordered' ? 'Order Placed' : 'Place Group Order')}
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <FaUsers className="text-yellow-500" /> Member Status
                        </h3>
                        <div className="space-y-3">
                            {group?.members.map((m) => (
                                <div key={m._id} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">
                                        {m.user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm">{m.user.name}</div>
                                        <div className="text-[10px] text-gray-500 capitalize">{m.user?._id === group.admin ? 'Admin' : 'Member'}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`w-2 h-2 rounded-full ${m.ready ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`}></div>
                                        {m.ready && <span className="text-[8px] text-green-500 font-bold uppercase">Ready</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};

export default GroupShopping;
