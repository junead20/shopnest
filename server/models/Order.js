// server/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  orderItems: [{
    name: { 
      type: String, 
      required: [true, 'Product name is required'] 
    },
    qty: { 
      type: Number, 
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    price: { 
      type: Number, 
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    image: {
      type: String,
      required: [true, 'Product image is required']
    }
  }],
  shippingAddress: {
    fullName: { type: String, required: [true, 'Full name is required'] },
    address: { type: String, required: [true, 'Address is required'] },
    city: { type: String, required: [true, 'City is required'] },
    state: { type: String, required: [true, 'State is required'] },
    zipCode: { type: String, required: [true, 'ZIP code is required'] },
    country: { type: String, required: [true, 'Country is required'], default: 'India' },
    phoneNumber: { 
      type: String, 
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Stripe', 'Razorpay', 'Cash on Delivery', 'Direct UPI QR', 'Razorpay UPI/QR']
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: String,
    email_address: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0.0,
    min: 0
  },
  taxPrice: {
    type: Number,
    required: true,
    default: 0.0,
    min: 0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0.0,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false
  },
  paidAt: Date,
  isDelivered: {
    type: Boolean,
    required: true,
    default: false
  },
  deliveredAt: Date,
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Refunded']
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String
  }],
  trackingNumber: String,
  estimatedDelivery: Date,
  cancellationReason: String,
  refundAmount: Number,
  refundedAt: Date,
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update status with history tracking
orderSchema.methods.updateStatus = function(newStatus, userId, note = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    updatedAt: new Date(),
    updatedBy: userId,
    note: note
  });
  
  // Update specific status flags
  if (newStatus === 'Delivered') {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }
  if (newStatus === 'Cancelled' || newStatus === 'Refunded') {
    // Handle cancellation logic
  }
};

// Calculate totals in INR
orderSchema.methods.calculateTotals = function() {
  this.itemsPrice = this.orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  this.taxPrice = this.itemsPrice * 0.18; // 18% GST for India
  this.shippingPrice = this.itemsPrice > 500 ? 0 : 40; // Free shipping above ₹500
  this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice;
};

module.exports = mongoose.model('Order', orderSchema);