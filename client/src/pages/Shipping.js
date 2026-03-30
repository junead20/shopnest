import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaTruck } from 'react-icons/fa';
import api from '../services/api';
import { saveShippingAddress } from '../store/slices/cartSlice';

const Shipping = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { shippingAddress } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const [address, setAddress] = useState({
    fullName: shippingAddress.fullName || user?.name || '',
    address: shippingAddress.address || '',
    city: shippingAddress.city || '',
    state: shippingAddress.state || '',
    zipCode: shippingAddress.zipCode || '',
    country: shippingAddress.country || 'India',
    phoneNumber: shippingAddress.phoneNumber || ''
  });

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setSavedAddresses(data.addresses || []);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const handleSelectSaved = (saved) => {
    setAddress({
      ...address,
      address: saved.street,
      city: saved.city,
      state: saved.state,
      zipCode: saved.zipCode,
      country: saved.country || 'India'
    });
  };

  const handleChange = (e) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(saveShippingAddress(address));
    navigate('/checkout');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-yellow-500 rounded-2xl shadow-xl shadow-yellow-200">
           <FaTruck className="text-white text-3xl" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Shipping Location</h1>
      </div>
      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-10 ml-16">Step 1 of 2: Arrival Details</p>

      {savedAddresses.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-500" /> Use a Saved Address
          </h2>
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
             {savedAddresses.map((addr, index) => (
               <button 
                 key={index}
                 type="button"
                 onClick={() => handleSelectSaved(addr)}
                 className="flex-shrink-0 w-64 bg-white p-5 rounded-3xl border-2 border-gray-100 hover:border-yellow-500 hover:shadow-xl transition-all text-left group"
               >
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-yellow-50 transition-colors">
                     <FaMapMarkerAlt className="text-gray-400 group-hover:text-yellow-600" />
                   </div>
                   {addr.isDefault && (
                     <span className="text-[10px] font-black uppercase tracking-tighter text-green-600 bg-green-50 px-2 py-1 rounded-lg">Home</span>
                   )}
                 </div>
                 <p className="font-bold text-gray-800 text-sm line-clamp-1">{addr.street}</p>
                 <p className="text-xs text-gray-500 font-medium">{addr.city}, {addr.zipCode}</p>
                 <div className="mt-4 text-[10px] font-black text-yellow-600 opacity-0 group-hover:opacity-100 uppercase tracking-widest transition-opacity">Select This →</div>
               </button>
             ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={address.fullName}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Street Address *
            </label>
            <input
              type="text"
              name="address"
              value={address.address}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={address.city}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              State *
            </label>
            <input
              type="text"
              name="state"
              value={address.state}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={address.zipCode}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Country *
            </label>
            <input
              type="text"
              name="country"
              value={address.country}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={address.phoneNumber}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              title="Please enter a 10-digit phone number"
              placeholder="10-digit mobile number"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 font-semibold mt-4"
        >
          Continue to Payment
        </button>
      </form>
    </div>
  );
};

export default Shipping;