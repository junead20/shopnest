// client/src/pages/OrderDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaPrint, 
  FaTruck, 
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaCreditCard,
  FaBox,
  FaSync,
  FaRupeeSign
} from 'react-icons/fa';
import api from '../services/api';
import { formatINR } from '../utils/currency';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
      setError(null);
    } catch (err) {
      console.error('Fetch order error:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancelling(true);
      await api.put(`/orders/${id}/cancel`, {
        reason: 'Cancelled by customer'
      });
      await fetchOrder();
    } catch (err) {
      console.error('Cancel order error:', err);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Delivered': return <FaCheckCircle className="text-green-500 text-2xl" />;
      case 'Shipped':
      case 'Out for Delivery': return <FaTruck className="text-blue-500 text-2xl" />;
      case 'Cancelled': return <FaTimesCircle className="text-red-500 text-2xl" />;
      default: return <FaClock className="text-yellow-500 text-2xl" />;
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600 mb-8">{error || 'Order not found'}</p>
        <button
          onClick={() => navigate('/orders')}
          className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const canCancel = ['Pending', 'Processing', 'Confirmed'].includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-yellow-500"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <FaPrint /> Print
          </button>
          <button
            onClick={fetchOrder}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <FaSync /> Refresh
          </button>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2">Order #{order._id.slice(-8)}</h1>
      <p className="text-gray-600 mb-8">Placed on {formatDate(order.createdAt)}</p>

      {/* Status Banner */}
      <div className={`mb-8 p-6 rounded-lg flex items-center gap-4 ${
        order.status === 'Delivered' ? 'bg-green-50' :
        order.status === 'Cancelled' ? 'bg-red-50' :
        'bg-blue-50'
      }`}>
        {getStatusIcon(order.status)}
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-1">Order Status: {order.status}</h2>
          <p className="text-gray-600">
            {order.status === 'Delivered' && 'Your order has been delivered successfully.'}
            {order.status === 'Shipped' && 'Your order is on the way!'}
            {order.status === 'Out for Delivery' && 'Your order is out for delivery today.'}
            {order.status === 'Processing' && 'Your order is being processed.'}
            {order.status === 'Confirmed' && 'Your order has been confirmed.'}
            {order.status === 'Pending' && 'Your order is pending confirmation.'}
            {order.status === 'Cancelled' && 'This order has been cancelled.'}
          </p>
        </div>
        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className={`px-6 py-2 rounded-lg text-white font-semibold ${
              cancelling 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items - Left Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaBox className="text-yellow-500" />
              Order Items
            </h2>

            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div key={index} className="flex gap-4 border-b pb-4 last:border-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/96'}
                  />
                  <div className="flex-1">
                    <Link 
                      to={`/product/${item.product}`}
                      className="font-semibold hover:text-yellow-500"
                    >
                      {item.name}
                    </Link>
                    <p className="text-gray-600">Quantity: {item.qty}</p>
                    <div className="flex items-center text-gray-600">
                      <FaRupeeSign className="text-sm" />
                      <span>{item.price.toLocaleString('en-IN')} each</span>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-yellow-600">
                    {formatINR(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">Order Timeline</h2>
              <div className="space-y-3">
                {order.statusHistory.map((history, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}></div>
                      {index < order.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-semibold">{history.status}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(history.updatedAt)}
                      </p>
                      {history.note && (
                        <p className="text-sm text-gray-500 mt-1">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary & Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span>{formatINR(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%):</span>
                <span>{formatINR(order.taxPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span>{order.shippingPrice === 0 ? 'Free' : formatINR(order.shippingPrice)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-2xl text-yellow-600">{formatINR(order.totalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`font-semibold ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.isPaid ? 'Paid' : 'Pending'}
                </span>
              </div>
              {order.paidAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Paid on {formatDate(order.paidAt)}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              Shipping Address
            </h2>
            
            <div className="space-y-1">
              <p className="font-semibold">{order.shippingAddress.fullName}</p>
              <p className="text-gray-600">{order.shippingAddress.address}</p>
              <p className="text-gray-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}
              </p>
              <p className="text-gray-600">{order.shippingAddress.country}</p>
              <p className="text-gray-600">Phone: {order.shippingAddress.phoneNumber}</p>
            </div>

            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Tracking Number:</p>
                <p className="font-mono font-semibold">{order.trackingNumber}</p>
              </div>
            )}

            {order.estimatedDelivery && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Estimated Delivery:</p>
                <p className="font-semibold text-green-600">
                  {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaCreditCard className="text-blue-500" />
              Payment Method
            </h2>
            
            <p className="font-semibold">{order.paymentMethod}</p>
            
            {order.paymentResult && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Transaction ID: {order.paymentResult.id}</p>
                <p>Status: {order.paymentResult.status}</p>
              </div>
            )}
          </div>

          {/* Need Help? */}
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-3">
              If you have any questions about your order, please contact our support team.
            </p>
            <button className="text-yellow-600 font-semibold hover:text-yellow-700">
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;