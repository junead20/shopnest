// server/models/GroupCart.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const groupCartSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  shareToken: {
    type: String,
    unique: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'invited'], default: 'active' },
    ready: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  }],
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votes: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['up', 'down'] }
    }]
  }],
  status: {
    type: String,
    enum: ['active', 'locked', 'ordered'],
    default: 'active'
  },
  discountType: { type: String, default: 'TeamBuy' },
  discountAmount: { type: Number, default: 0 } // Percentage
}, {
  timestamps: true
});

// Generate a random token before saving
groupCartSchema.pre('save', function(next) {
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(8).toString('hex');
  }
  next();
});

module.exports = mongoose.model('GroupCart', groupCartSchema);
