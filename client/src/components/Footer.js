// client/src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#232F3E] text-white mt-8">
      {/* Footer Links */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Get to Know Us */}
          <div>
            <h3 className="font-bold text-lg mb-4">Get to Know Us</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/press" className="hover:text-white transition-colors">Press Releases</Link></li>
              <li><Link to="/blog" className="hover:text-white transition-colors">ShopNest Blog</Link></li>
            </ul>
          </div>

          {/* Make Money with Us */}
          <div>
            <h3 className="font-bold text-lg mb-4">Make Money with Us</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/sell" className="hover:text-white transition-colors">Sell on ShopNest</Link></li>
              <li><Link to="/affiliate" className="hover:text-white transition-colors">Become an Affiliate</Link></li>
              <li><Link to="/advertise" className="hover:text-white transition-colors">Advertise Your Products</Link></li>
              <li><Link to="/self-publish" className="hover:text-white transition-colors">Self-Publish with Us</Link></li>
            </ul>
          </div>

          {/* ShopNest Payment Products */}
          <div>
            <h3 className="font-bold text-lg mb-4">ShopNest Payment Products</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/rewards" className="hover:text-white transition-colors">ShopNest Rewards</Link></li>
              <li><Link to="/credit-card" className="hover:text-white transition-colors">ShopNest Credit Card</Link></li>
              <li><Link to="/points" className="hover:text-white transition-colors">Shop with Points</Link></li>
              <li><Link to="/reload" className="hover:text-white transition-colors">Reload Your Balance</Link></li>
            </ul>
          </div>

          {/* Let Us Help You */}
          <div>
            <h3 className="font-bold text-lg mb-4">Let Us Help You</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/account" className="hover:text-white transition-colors">Your Account</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Your Orders</Link></li>
              <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Rates & Policies</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Replacements</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <Link to="/" className="text-2xl font-bold text-white inline-block mb-4">
            Shop<span className="text-yellow-500">Nest</span>
          </Link>
          <div className="flex justify-center gap-4 text-sm text-gray-400 mb-4">
            <Link to="/conditions" className="hover:text-white transition-colors">Conditions of Use</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Notice</Link>
            <Link to="/ads" className="hover:text-white transition-colors">Interest-Based Ads</Link>
          </div>
          <p className="text-sm text-gray-500">© 2025 ShopNest. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;