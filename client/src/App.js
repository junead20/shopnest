// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Shipping from './pages/Shipping';
import GroupShopping from './pages/GroupShopping';
import MyGroups from './pages/MyGroups'; // Added MyGroups import
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import CategoryPage from './pages/CategoryPage';
import SearchResults from './pages/SearchResults';
import OrderSuccess from './pages/OrderSuccess';

// Deal Pages
import DealsPage from './pages/DealsPage';

// Admin Components
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';

// Debug Pages (optional - remove in production)
import ApiTest from './pages/ApiTest';
import Debug from './pages/Debug';

// Styles
import './App.css';


function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/search" element={<SearchResults />} />
              {/* Public Group Shopping routes */}
              <Route path="/group-shop" element={<GroupShopping />} />
              <Route path="/group-shop/:token" element={<GroupShopping />} />
              <Route path="/my-groups" element={<MyGroups />} />

              {/* Deal Routes - Using DealsPage with query params */}
              <Route path="/deals" element={<DealsPage />} />

              {/* Protected Routes */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:id" element={<OrderDetails />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/add" element={<AddProduct />} />
              <Route path="/admin/products/edit/:id" element={<EditProduct />} />
              <Route path="/admin/orders" element={<AdminOrders />} />

              {/* Debug Routes - Remove in production */}
              <Route path="/api-test" element={<ApiTest />} />
              <Route path="/debug" element={<Debug />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;