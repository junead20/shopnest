// client/src/pages/Orders.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBox, 
  FaClock, 
  FaCheckCircle, 
  FaTruck,
  FaEye,
  FaTimesCircle,
  FaSync
} from 'react-icons/fa';
import api from '../services/api';
import { formatINR } from '../utils/currency';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders/myorders');
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);



  const getStatusIcon = (status) => {
    switch(status) {
      case 'Delivered': return <FaCheckCircle className="text-green-500" />;
      case 'Shipped':
      case 'Out for Delivery': return <FaTruck className="text-blue-500" />;
      case 'Cancelled': return <FaTimesCircle className="text-red-500" />;
      default: return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Shipped':
      case 'Out for Delivery': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600 mb-8">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-lg">
        <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Start shopping to place your first order!</p>
        <Link
          to="/"
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 inline-block"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-gray-600 hover:text-yellow-500"
          title="Refresh"
        >
          <FaSync className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Order Header */}
            <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(order.status)}
                <div>
                  <p className="text-sm text-gray-600">Order #{order._id.slice(-8)}</p>
                  <p className="text-sm text-gray-600">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <Link
                  to={`/order/${order._id}`}
                  className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700"
                >
                  <FaEye />
                  View Details
                </Link>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-6">
              <div className="space-y-3">
                {order.orderItems.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/64'}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                    </div>
                    <p className="font-semibold text-yellow-600">
                      {formatINR(item.price * item.qty)}
                    </p>
                  </div>
                ))}
                {order.orderItems.length > 2 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{order.orderItems.length - 2} more items
                  </p>
                )}
              </div>

              {/* Order Footer */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div>
                  {order.trackingNumber && (
                    <p className="text-sm text-gray-600">
                      Tracking: <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                  )}
                  {order.estimatedDelivery && (
                    <p className="text-sm text-gray-600">
                      Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatINR(order.totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;