// server/routes/wishlist.js
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('items.product', 'name price imageUrl brand rating countInStock description');
    
    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        items: []
      });
      await wishlist.save();
    }
    
    res.json(wishlist);
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    let wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user.id,
        items: [{ product: productId }]
      });
    } else {
      const itemExists = wishlist.items.some(
        item => item.product.toString() === productId
      );
      
      if (itemExists) {
        return res.status(400).json({ message: 'Item already in wishlist' });
      }
      
      wishlist.items.push({ product: productId });
    }
    
    await wishlist.save();
    await wishlist.populate('items.product', 'name price imageUrl brand rating countInStock description');
    
    res.status(201).json(wishlist);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/wishlist/:productId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== req.params.productId
    );
    
    await wishlist.save();
    await wishlist.populate('items.product', 'name price imageUrl brand rating countInStock description');
    
    res.json(wishlist);
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;