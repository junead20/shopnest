// client/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaUserCircle, FaEnvelope, FaUserTag, FaMapMarkerAlt, FaPhone, FaEdit, FaSave } from 'react-icons/fa';
import api from '../services/api';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    addresses: []
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        addresses: data.addresses || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', formData);
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <FaUserCircle className="text-8xl text-gray-400 mx-auto" />
              <h2 className="text-xl font-semibold mt-2">{profile?.name}</h2>
              <p className="text-gray-500">{profile?.email}</p>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Member since:</span>{' '}
                {new Date(profile?.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Account type:</span>{' '}
                {profile?.isAdmin ? 'Administrator' : 'Customer'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Personal Information</h2>
              <button
                onClick={() => editing ? handleSave() : setEditing(true)}
                className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
              >
                {editing ? <FaSave /> : <FaEdit />}
                {editing ? 'Save' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaUserCircle className="text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{profile?.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaEnvelope className="text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{profile?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FaPhone className="text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-semibold">{profile?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Addresses Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              Saved Addresses
            </h2>
            
            {profile?.addresses && profile.addresses.length > 0 ? (
              <div className="space-y-3">
                {profile.addresses.map((addr, index) => (
                  <div key={index} className="border p-3 rounded-lg">
                    <p>{addr.address}</p>
                    <p>{addr.city}, {addr.state} - {addr.zipCode}</p>
                    <p>{addr.country}</p>
                    {addr.isDefault && (
                      <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Default Address
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No addresses saved yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;