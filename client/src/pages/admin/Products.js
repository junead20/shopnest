// client/src/pages/admin/Products.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaArrowLeft } from 'react-icons/fa';
import gsap from 'gsap';
import api from '../../services/api';
import { formatINRSimple } from '../../utils/currency';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const headerRef = useRef(null);
  const tableRef = useRef(null);

  const categories = [
    'All', 'Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports', 'Toys & Games', 'Other'
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  // GSAP animations
  useEffect(() => {
    if (!loading && products.length > 0) {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(headerRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 }
      );

      tl.fromTo('.product-row',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.04 },
        '-=0.2'
      );
    }
  }, [loading, products]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=1000');
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      setDeleteLoading(id);
      await api.delete(`/products/${id}`);

      // Animate out the row
      const row = document.querySelector(`[data-product-id="${id}"]`);
      if (row) {
        gsap.to(row, {
          x: 100, opacity: 0, height: 0, padding: 0, duration: 0.4,
          onComplete: () => fetchProducts()
        });
      } else {
        fetchProducts();
      }
    } catch (error) {
      alert(`❌ Error: ${error.message || 'Failed to delete product'}`);
      console.error('Error deleting product:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div ref={headerRef}>
        {/* Back to Dashboard */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-yellow-600 mb-4 transition-all hover:gap-3"
        >
          <FaArrowLeft /> Back to Dashboard
        </Link>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
            Manage Products
          </h1>
          <Link
            to="/admin/products/add"
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all hover:scale-105 hover:shadow-lg"
          >
            <FaPlus /> Add Product
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-shadow"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-shadow"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500 font-medium">{filteredProducts.length} products</span>
        </div>
      </div>

      <div ref={tableRef} className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Rating</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map(product => (
                <tr
                  key={product._id}
                  data-product-id={product._id}
                  className="product-row hover:bg-yellow-50/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg bg-gray-100 hover:scale-150 transition-transform duration-300 cursor-zoom-in shadow-sm"
                      onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">N/A</text></svg>`; }}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm max-w-xs truncate">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.brand}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm font-semibold">
                      {formatINRSimple(product.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.countInStock > 5
                      ? 'bg-green-100 text-green-800'
                      : product.countInStock > 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {product.countInStock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-yellow-500">{product.rating ? `${product.rating} ★` : '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/products/edit/${product._id}`}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all hover:scale-110"
                        title="Edit Product"
                      >
                        <FaEdit size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        disabled={deleteLoading === product._id}
                        className={`p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all hover:scale-110 ${deleteLoading === product._id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        title="Delete Product"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products found matching your search
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;