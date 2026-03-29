// server/server.js
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const wishlistRoutes = require('./routes/wishlist');
const paymentRoutes = require('./routes/payment');
const recommendationRoutes = require('./routes/recommendations');
const groupCartRoutes = require('./routes/groupCart');
const razorpayRoutes = require('./routes/razorpay');

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  'https://shopnest-psi.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach io to app to use in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('👤 A user connected:', socket.id);

  socket.on('joinGroup', (token) => {
    socket.join(token);
    console.log(`🏠 User ${socket.id} joined group: ${token}`);
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected');
  });
});

// CORS setup
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// IMPORTANT: Simple connection options that work
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      // NO TLS options - this is key!
    });
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};

connectDB();

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    port: 5000,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/group-cart', groupCartRoutes);
app.use('/api/payment/razorpay', razorpayRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});