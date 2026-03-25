// client/src/pages/Debug.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Debug = () => {
  const [status, setStatus] = useState('Testing connection...');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('Attempting to connect to http://localhost:5000/api/products...');
      const { data } = await api.get('/products?limit=5');
      setProducts(data.products || []);
      setStatus(`✅ Connected! Found ${data.total || 0} products`);
    } catch (error) {
      setStatus(`❌ Connection failed: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="font-mono">{status}</p>
      </div>
      
      {products.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Sample Products:</h2>
          <ul className="space-y-2">
            {products.map(p => (
              <li key={p._id} className="border p-2 rounded">
                {p.name} - ₹{p.price}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={testConnection}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Again
      </button>
    </div>
  );
};

export default Debug;