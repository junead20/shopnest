// client/src/pages/admin/Orders.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FaEye,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaTimesCircle,
  FaSync,
  FaChevronDown,
  FaChevronUp,
  FaShippingFast,
  FaArrowLeft,
  FaClipboardList
} from 'react-icons/fa';
import { useCallback } from 'react';
import gsap from 'gsap';
import api from '../../services/api';
import { formatINRSimple } from '../../utils/currency';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  // GSAP Ref
  const headerRef = useRef(null);
  const tableRef = useRef(null);

  // Shipping update form state
  const [shippingForm, setShippingForm] = useState({
    status: '',
    trackingNumber: '',
    estimatedDelivery: '',
    note: ''
  });

  const allStatuses = ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      if (statusFilter) params.append('status', statusFilter);

      const { data } = await api.get(`/orders/admin/all?${params.toString()}`);
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalOrders(data.total || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Make sure you are logged in as an admin.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  // GSAP Effect
  useEffect(() => {
    if (!loading && orders.length > 0) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 }
      );

      tl.fromTo('.order-row',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.04 },
        '-=0.2'
      );
    }
  }, [loading, orders]);


  const handleExpandOrder = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setShippingForm({
          status: order.status,
          trackingNumber: order.trackingNumber || '',
          estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
          note: ''
        });

        // Slight delay for React to render the expanded section, then animate it
        setTimeout(() => {
          gsap.fromTo(`.expanded-content-${orderId}`,
            { height: 0, opacity: 0 },
            { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.inOut' }
          );
        }, 10);
      }
    }
  };

  const handleUpdateOrder = async (orderId) => {
    try {
      setUpdatingOrder(orderId);

      // Update status
      await api.put(`/orders/${orderId}/status`, {
        status: shippingForm.status,
        note: shippingForm.note || `Status updated to ${shippingForm.status}`,
        trackingNumber: shippingForm.trackingNumber || undefined,
        estimatedDelivery: shippingForm.estimatedDelivery || undefined
      });

      alert('✅ Order updated successfully!');

      // Animate collapse before fetching
      gsap.to(`.expanded-content-${orderId}`, {
        height: 0, opacity: 0, duration: 0.3, ease: 'power2.inOut',
        onComplete: () => {
          setExpandedOrder(null);
          fetchOrders();
        }
      });

    } catch (err) {
      alert(`❌ Error: ${err.message || 'Failed to update order'}`);
      console.error('Update order error:', err);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <FaCheckCircle className="text-green-500" />;
      case 'Shipped':
      case 'Out for Delivery': return <FaTruck className="text-blue-500" />;
      case 'Cancelled':
      case 'Refunded': return <FaTimesCircle className="text-red-500" />;
      case 'Processing':
      case 'Confirmed': return <FaShippingFast className="text-purple-500" />;
      default: return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Shipped':
      case 'Out for Delivery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cancelled':
      case 'Refunded': return 'bg-red-100 text-red-800 border-red-200';
      case 'Processing':
      case 'Confirmed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16 bg-white rounded-xl shadow-lg">
          <FaExclamationTriangle className="text-5xl text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <FaSync /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div ref={headerRef}>
        {/* Back to Dashboard */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-all hover:gap-3"
        >
          <FaArrowLeft /> Back to Dashboard
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Manage Orders
            </h1>
            <p className="text-gray-600 mt-1 font-medium">{totalOrders} total orders</p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-blue-50 transition-colors shadow-sm text-gray-700"
          >
            <FaSync className={loading ? "animate-spin text-blue-500" : "text-blue-500"} /> Refresh
          </button>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${statusFilter === ''
              ? 'bg-blue-600 text-white shadow-md scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All Orders
          </button>
          {allStatuses.map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${statusFilter === status
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div ref={tableRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y relative">
              {orders.map(order => (
                <React.Fragment key={order._id}>
                  <tr className={`order-row transition-colors duration-200 ${expandedOrder === order._id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-gray-700">
                        #{order._id.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-800">{order.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{order.user?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{order.orderItems?.length || 0} items</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center font-bold text-sm text-gray-800">
                        {formatINRSimple(order.totalPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${order.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                        {order.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)} {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/order/${order._id}`}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all hover:scale-110"
                          title="View Details"
                        >
                          <FaEye size={14} />
                        </Link>
                        <button
                          onClick={() => handleExpandOrder(order._id)}
                          className={`p-2 rounded-lg transition-all hover:scale-110 ${expandedOrder === order._id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          title="Update Shipping/Status"
                        >
                          {expandedOrder === order._id ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Order Details */}
                  {expandedOrder === order._id && (
                    <tr className={`expanded-content-${order._id} overflow-hidden`}>
                      <td colSpan="8" className="p-0 border-b-2 border-blue-100">
                        <div className="bg-gradient-to-b from-blue-50/50 to-white px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Status & Shipping Update Panel */}
                            <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
                              <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-gray-800 border-b pb-3">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                  <FaTruck />
                                </div>
                                Update Order Status & Shipping
                              </h3>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Status</label>
                                  <select
                                    value={shippingForm.status}
                                    onChange={(e) => setShippingForm({ ...shippingForm, status: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
                                  >
                                    {allStatuses.map(s => (
                                      <option key={s} value={s}>{s}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tracking Number</label>
                                  <input
                                    type="text"
                                    value={shippingForm.trackingNumber}
                                    onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                                    placeholder="e.g. AWB12345678"
                                    className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Estimated Delivery</label>
                                  <input
                                    type="date"
                                    value={shippingForm.estimatedDelivery}
                                    onChange={(e) => setShippingForm({ ...shippingForm, estimatedDelivery: e.target.value })}
                                    className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Note (Optional)</label>
                                  <input
                                    type="text"
                                    value={shippingForm.note}
                                    onChange={(e) => setShippingForm({ ...shippingForm, note: e.target.value })}
                                    placeholder="Reason for update or message to customer"
                                    className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                  />
                                </div>

                                <button
                                  onClick={() => handleUpdateOrder(order._id)}
                                  disabled={updatingOrder === order._id}
                                  className={`w-full py-3 rounded-lg text-white font-bold flex items-center justify-center gap-2 mt-6 transition-all shadow-md ${updatingOrder === order._id
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5'
                                    }`}
                                >
                                  {updatingOrder === order._id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <FaCheckCircle className="text-lg" /> Confirm Update
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Order Info Panel */}
                            <div className="space-y-5">
                              {/* Shipping Address */}
                              <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Shipping Address</h3>
                                <div className="text-sm text-gray-600 space-y-1.5 p-3 bg-gray-50 rounded-lg">
                                  <p className="font-bold text-gray-800 text-base">{order.shippingAddress?.fullName}</p>
                                  <p className="mt-1">{order.shippingAddress?.address}</p>
                                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}</p>
                                  <p className="font-medium text-gray-700">{order.shippingAddress?.country}</p>
                                  <p className="pt-2 mt-2 border-t border-gray-200">
                                    <span className="text-gray-400 mr-2">📞</span>
                                    <span className="font-medium">{order.shippingAddress?.phoneNumber}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Order Items Summary */}
                              <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Order Items</h3>
                                <div className="space-y-3">
                                  {order.orderItems?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded overflow-hidden bg-white border shrink-0">
                                          <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none' }}
                                          />
                                        </div>
                                        <span className="font-medium line-clamp-1">{item.name}</span>
                                      </div>
                                      <span className="font-bold text-gray-700 whitespace-nowrap ml-4">
                                        {item.qty} × {formatINRSimple(item.price)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="border-t mt-4 pt-4 flex justify-between items-center font-bold text-lg">
                                  <span className="text-gray-800">Total Amount:</span>
                                  <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{formatINRSimple(order.totalPrice)}</span>
                                </div>
                              </div>

                              {/* Status History */}
                              {order.statusHistory && order.statusHistory.length > 0 && (
                                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100">
                                  <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Status History Timeline</h3>
                                  <div className="space-y-0.5 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                                    {order.statusHistory.slice().reverse().map((h, idx) => (
                                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group border-b last:border-0 border-gray-100 py-3">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 mx-2"></div>
                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] px-3 text-sm">
                                          <div className="font-bold text-gray-800">{h.status}</div>
                                          <div className="text-gray-500 text-xs mt-0.5">{formatDate(h.updatedAt)}</div>
                                          {h.note && <div className="text-gray-600 bg-gray-50 p-2 rounded mt-1 mt-1 text-xs italic">"{h.note}"</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <FaClipboardList className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-lg">No orders found {statusFilter ? `with status "${statusFilter}"` : ''}</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${page === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 shadow hover:shadow-md hover:-translate-y-0.5'
              }`}
          >
            ← Previous
          </button>

          <div className="bg-white px-5 py-2.5 rounded-lg shadow font-medium text-gray-600">
            Page <span className="text-blue-600 font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${page === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 shadow hover:shadow-md hover:-translate-y-0.5'
              }`}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;