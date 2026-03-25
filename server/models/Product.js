// server/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  category: { 
    type: String, 
    required: true,
    enum: ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Toys & Games', 'Beauty', 'Grocery', 'Other'],
    default: 'Other'
  },
  brand: { type: String, required: true, default: 'Generic' },
  countInStock: { type: Number, required: true, min: 0, default: 0 },
  imageUrl: { type: String, required: true, default: 'https://via.placeholder.com/300' },
  images: [String],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  currency: { type: String, default: 'INR' },
  discount: { type: Number, default: 0 },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  // Allow unknown categories to be saved (temporarily)
  strict: false 
});

module.exports = mongoose.model('Product', productSchema);