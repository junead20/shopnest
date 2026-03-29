// server/routes/razorpay.js
const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');

// Initialize Razorpay
// Note: These must be added to .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

/**
 * @route   POST /api/payment/razorpay/order
 * @desc    Create a Razorpay Order
 * @access  Private
 */
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: 'Error creating Razorpay order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ 
      message: 'Razorpay Order Creation Failed',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/payment/razorpay/verify
 * @desc    Verify Razorpay Payment Signature
 * @access  Private
 */
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'mock_secret')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return res.json({ 
        success: true, 
        message: "Payment verified successfully" 
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid signature" 
      });
    }
  } catch (error) {
    console.error('Razorpay Verification Error:', error);
    res.status(500).json({ 
      message: 'Payment Verification Failed',
      error: error.message 
    });
  }
});

module.exports = router;
