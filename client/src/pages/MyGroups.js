import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaUsers, FaArrowRight, FaPlus, FaClock } from 'react-icons/fa';
import api from '../services/api';

const MyGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            fetchGroups();
        }
    }, [user]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/group-cart/user/my-groups');
            setGroups(data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading your shopping groups...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">My Shopping Groups</h1>
                    <p className="text-gray-500 text-lg">Manage all your active and previous group sessions</p>
                </div>
                <Link 
                    to="/group-shop" 
                    className="flex items-center gap-2 bg-yellow-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-100"
                >
                    <FaPlus /> Create New Group
                </Link>
            </div>

            {groups.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                        <FaUsers size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-400">No Groups Found</h2>
                    <p className="text-gray-400 mt-2">Start a group session and shop with your friends!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Link 
                            key={group._id} 
                            to={`/group-shop/${group.shareToken}`}
                            className="bg-white rounded-[2rem] p-6 border border-gray-100 hover:border-yellow-200 hover:shadow-2xl hover:shadow-yellow-100 transition-all group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    group.status === 'active' ? 'bg-green-100 text-green-600' : 
                                    group.status === 'locked' ? 'bg-yellow-100 text-yellow-600' : 
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {group.status}
                                </div>
                                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                    <FaClock /> {new Date(group.updatedAt).toLocaleDateString()}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors mb-2">
                                {group.name}
                            </h3>
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex -space-x-2">
                                    {group.members.slice(0, 3).map((member, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {member.user?.name?.charAt(0) || '?'}
                                        </div>
                                    ))}
                                    {group.members.length > 3 && (
                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-yellow-500 flex items-center justify-center text-[10px] font-bold text-white">
                                            +{group.members.length - 3}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{group.members.length} members</span>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                                <div className="text-sm font-bold text-gray-900">
                                    {group.items.length} {group.items.length === 1 ? 'Item' : 'Items'}
                                </div>
                                <div className="text-yellow-500 group-hover:translate-x-1 transition-transform">
                                    <FaArrowRight />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyGroups;
