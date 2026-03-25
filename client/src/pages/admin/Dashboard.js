// client/src/pages/admin/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaRupeeSign,
  FaChartLine,
  FaExclamationTriangle,
  FaPlus,
  FaClipboardList
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import gsap from 'gsap';
import api from '../../services/api';
import { formatINRSimple } from '../../utils/currency';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: {},
    revenue: {},
    users: {},
    products: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // GSAP refs
  const headerRef = useRef(null);
  const metricsRef = useRef(null);
  const overviewRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    if (!loading && !error) {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Header slide in
      tl.fromTo(headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      );

      // Metric cards stagger
      tl.fromTo('.metric-card',
        { y: 40, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.12 },
        '-=0.3'
      );

      // Overview panels slide in
      tl.fromTo('.overview-panel',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.15 },
        '-=0.2'
      );

      // Quick action cards pop in
      tl.fromTo('.action-card',
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.1 },
        '-=0.2'
      );
    }
  }, [loading, error]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [ordersStats, userStats, productStats] = await Promise.all([
                api.get('/orders/admin/stats'),
                api.get('/auth/admin/stats'),
                api.get('/products/admin/stats')
            ]);

            setStats({
                orders: ordersStats.data.orderStats || {},
                revenue: ordersStats.data.revenue || { total: 0, average: 0 },
                users: userStats.data || { total: 0, newUsers: 0 },
                products: productStats.data || { total: 0, lowStock: 0, categoryStats: [] }
            });
            setError(null);
        } catch (err) {
            console.error('Dashboard data error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const orderChartData = {
        labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        datasets: [{
            data: [
                stats.orders.pending || 0,
                stats.orders.processing || 0,
                stats.orders.shipped || 0,
                stats.orders.delivered || 0,
                stats.orders.cancelled || 0
            ],
            backgroundColor: ['#eab308', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };

    const categoryChartData = {
        labels: stats.products.categoryStats?.map(c => c._id) || [],
        datasets: [{
            label: 'Items in Category',
            data: stats.products.categoryStats?.map(c => c.count) || [],
            backgroundColor: '#fbbf24',
            borderRadius: 8
        }]
    };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaChartLine className="text-yellow-500 text-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <FaExclamationTriangle className="text-5xl text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-all hover:scale-105"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div ref={headerRef} className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's your store overview.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/products/add" className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all hover:scale-105 hover:shadow-lg">
            <FaPlus /> Add Product
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div ref={metricsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="metric-card bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <FaRupeeSign size={24} />
            </div>
            <span className="text-3xl font-bold">{formatINRSimple(stats.revenue.total)}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-sm opacity-80 mt-1">Avg: {formatINRSimple(stats.revenue.average)}</p>
        </div>

        {/* Orders Card */}
        <div className="metric-card bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <FaShoppingCart size={24} />
            </div>
            <span className="text-3xl font-bold">{stats.orders.total || 0}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Orders</h3>
          <div className="flex gap-2 text-sm opacity-80 mt-1">
            <span>Pending: {stats.orders.pending || 0}</span>
            <span>•</span>
            <span>Delivered: {stats.orders.delivered || 0}</span>
          </div>
        </div>

        {/* Users Card */}
        <div className="metric-card bg-gradient-to-br from-violet-500 to-violet-700 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <FaUsers size={24} />
            </div>
            <span className="text-3xl font-bold">{stats.users.total || 0}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-sm opacity-80 mt-1">+{stats.users.newUsers || 0} new this month</p>
        </div>

        {/* Products Card */}
        <div className="metric-card bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
              <FaBox size={24} />
            </div>
            <span className="text-3xl font-bold">{stats.products.total || 0}</span>
          </div>
          <h3 className="text-lg font-semibold">Total Products</h3>
          <p className="text-sm opacity-80 mt-1">{stats.products.lowStock || 0} low in stock</p>
        </div>
      </div>

      <div ref={overviewRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="overview-panel bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            Order Distribution
          </h2>
          <div className="h-64 flex justify-center">
            <Doughnut 
              data={orderChartData} 
              options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} 
            />
          </div>
        </div>

        <div className="overview-panel bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-xl font-bold mb-4">Inventory by Category</h2>
          <div className="h-64">
            <Bar 
              data={categoryChartData}
              options={{ 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
      <div ref={actionsRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/products"
          className="action-card bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group border border-transparent hover:border-yellow-200"
        >
          <div className="bg-yellow-50 p-4 rounded-xl w-fit mb-4 group-hover:bg-yellow-100 transition-colors">
            <FaBox className="text-3xl text-yellow-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-lg font-bold mb-2">Manage Products</h3>
          <p className="text-gray-600 text-sm">Add, edit, or remove products from your store</p>
          <div className="mt-4 text-sm text-yellow-600 font-semibold flex items-center gap-1">
            {stats.products.lowStock || 0} products low in stock
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="action-card bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group border border-transparent hover:border-blue-200"
        >
          <div className="bg-blue-50 p-4 rounded-xl w-fit mb-4 group-hover:bg-blue-100 transition-colors">
            <FaClipboardList className="text-3xl text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-lg font-bold mb-2">Manage Orders</h3>
          <p className="text-gray-600 text-sm">View and update order status & shipping</p>
          <div className="mt-4 text-sm text-blue-600 font-semibold flex items-center gap-1">
            {stats.orders.pending || 0} orders pending
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        <Link
          to="/admin/products/add"
          className="action-card bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group border border-transparent hover:border-green-200"
        >
          <div className="bg-green-50 p-4 rounded-xl w-fit mb-4 group-hover:bg-green-100 transition-colors">
            <FaPlus className="text-3xl text-green-500 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-lg font-bold mb-2">Add New Product</h3>
          <p className="text-gray-600 text-sm">Create and publish a new product listing</p>
          <div className="mt-4 text-sm text-green-600 font-semibold flex items-center gap-1">
            Start adding
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;