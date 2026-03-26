// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/sendEmail');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '223325285875-lgbb4m0al60sdoc97o295j4ui69522mt.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.name
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide all required fields',
        errors: {
          name: !name ? 'Name is required' : null,
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null
        }
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Strict Email Format Validation
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!strictEmailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format. Please provide a real email (e.g., user@gmail.com)'
      });
    }

    // Block common disposable/fake domains
    const blockedDomains = ['test.com', 'example.com', 'mailinator.com', 'tempmail.com'];
    const domain = email.split('@')[1].toLowerCase();
    
    if (blockedDomains.includes(domain)) {
      return res.status(400).json({
        message: 'This email domain is not allowed. Please use a valid email service.'
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create verification JWT (Zero-DB Signup)
    const verificationToken = jwt.sign(
      { name, email, password },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    // Create verification URL
    const frontendUrl = process.env.FRONTEND_URL || 'https://shopnest-psi.vercel.app';
    const verifyUrl = `${frontendUrl}/verify/${verificationToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: #232f3e; text-align: center;">Welcome to ShopNest!</h1>
        <p>You're almost there! Click the button below to verify your email and <strong>create your account</strong>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #f0c14b; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #a88734;">Verify My Email</a>
        </div>
        <p style="font-size: 12px; color: #555;">Note: Your account is NOT created yet. You must click verify to finish signup. This link expires in 24 hours.</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <p style="font-size: 10px; color: #888;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email,
        subject: 'Confirm your ShopNest Registration',
        html: message
      });

      res.status(201).json({
        message: 'Verification email sent! Please check your inbox and click the verify button to create your account.'
      });
    } catch (err) {
      console.error('Error sending verification email:', err);
      // In production, if SMTP fails, we should let the user know and maybe try again later
      res.status(500).json({
        message: 'Registration triggered, but we could not send the verification email to your inbox.',
        smtpError: err.message,
        smtpCode: err.code
      });
    }
  } catch (error) {
    console.error('Register error (outer):', error);
    res.status(500).json({ 
      message: error.message || 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email address before logging in.' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profileImage: user.profileImage,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/google
// @desc    Google Login
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: 'Google email is not verified. Please verify your Google account.' });
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password for Google users
        profileImage: picture,
        isGoogleUser: true,
        googleId,
        isVerified: true // Google accounts are already verified
      });
      await user.save();
    } else {
      // Update existing user with Google info if needed
      user.lastLogin = Date.now();
      if (!user.profileImage) user.profileImage = picture;
      await user.save();
    }

    // Generate token
    const authToken = generateToken(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      profileImage: user.profileImage,
      token: authToken
    });
  } catch (error) {
    console.error('Google Login error:', error);
    res.status(500).json({ message: 'Server error during Google login' });
  }
});

// @route   GET /api/auth/verify/:token
// @desc    Verify email and CREATE user
// @access  Public
router.get('/verify/:token', async (req, res) => {
  try {
    const token = req.params.token;

    // Decode the token (it contains name, email, password)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { name, email, password } = decoded;

    // Final check: Is the email still available?
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user already exists but isn't verified, maybe they verified twice.
      // Or maybe somebody else took the email in the last 5 minutes.
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=Email+already+registered`);
    }

    // CREATE THE USER NOW
    const newUser = new User({
      name,
      email,
      password,
      isVerified: true
    });

    await newUser.save();

    // Success! Redirect to login
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?verified=true`);

  } catch (error) {
    console.error('Verification error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    if (error.name === 'TokenExpiredError') {
      return res.redirect(`${frontendUrl}/register?error=Verification+link+expired`);
    }
    
    res.redirect(`${frontendUrl}/register?error=Invalid+verification+link`);
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phoneNumber } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/admin/stats
// @desc    Get user statistics (admin only)
// @access  Private/Admin
router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ isAdmin: true });
    const customerUsers = await User.countDocuments({ isAdmin: false });

    // Users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Users with orders
    const usersWithOrders = await Order.aggregate([
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);

    // Daily registrations for last 30 days
    const dailyRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      total: totalUsers,
      admins: adminUsers,
      customers: customerUsers,
      newUsers,
      usersWithOrders: usersWithOrders[0]?.total || 0,
      dailyRegistrations
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/auth/:id
// @desc    Delete user and cascade delete orders/wishlist
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Admins cannot delete themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    // CASCADE DELETE: Remove all associated Orders for this user
    await Order.deleteMany({ user: user._id });

    // CASCADE DELETE: Remove the Wishlist for this user
    await Wishlist.deleteOne({ user: user._id });

    // Finally, remove the user
    await user.deleteOne();

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send reset password token
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set resetToken to user field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiration (1 hour)
    user.resetPasswordExpire = Date.now() + 3600000;

    await user.save();

    // In a real app, send email here. For now, return the token in response
    // to simulate the email verification process.
    res.json({
      message: 'Password reset link sent to email (Simulated)',
      resetToken: resetToken // ONLY FOR DEMO. In production, this goes to email
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    // Hash the token from URL
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// @route   GET /api/auth/test-email
// @desc    Test SMTP connection
// @access  Public
router.get('/test-email', async (req, res) => {
  try {
    await sendEmail({
      email: process.env.EMAIL_USER || 'helloboss655@gmail.com',
      subject: 'ShopNest SMTP Test',
      html: '<h1>SMTP is working!</h1>'
    });
    res.json({ message: 'SMTP Test Successful! Email sent.' });
  } catch (error) {
    console.error('SMTP Test Error:', error);
    res.status(500).json({ 
      message: 'SMTP Test Failed', 
      error: error.message,
      code: error.code,
      command: error.command
    });
  }
});

module.exports = router;