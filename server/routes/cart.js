// server/routes/cart.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // In a real app, you'd fetch from database
    // For now, we'll return a simple response
    res.json({ 
      message: 'Cart route working',
      userId: req.user.id 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    res.status(201).json({ 
      message: 'Item added to cart',
      productId,
      quantity,
      userId: req.user.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/cart/:itemId
// @desc    Update cart item quantity
// @access  Private
router.put('/:itemId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    res.json({ 
      message: 'Cart item updated',
      itemId: req.params.itemId,
      quantity,
      userId: req.user.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/cart/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    res.json({ 
      message: 'Item removed from cart',
      itemId: req.params.itemId,
      userId: req.user.id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;