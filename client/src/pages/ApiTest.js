// client/src/pages/ApiTest.js
import React, { useState } from 'react';


const ApiTest = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Try multiple endpoints
      const endpoints = [
        'http://localhost:5000/api/test',
        'http://127.0.0.1:5000/api/test',
        'http://192.168.190.1:5000/api/test'
      ];

      for (const url of endpoints) {
        try {
          console.log('Trying:', url);
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setResult({ success: true, url, data });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('Failed:', url);
        }
      }
      
      setResult({ success: false, error: 'Could not connect on any endpoint' });
    } catch (error) {
      setResult({ success: false, error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {result.success ? (
            <div>
              <p className="text-green-700">✅ Connected successfully!</p>
              <p className="text-sm mt-2">URL: {result.url}</p>
              <pre className="mt-2 text-xs bg-white p-2 rounded">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p className="text-red-700">❌ Connection failed</p>
              <p className="text-sm mt-2">{result.error}</p>
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <p className="font-semibold">Troubleshooting steps:</p>
                <ol className="list-decimal ml-4 mt-2 text-sm">
                  <li>Make sure backend is running: <code>cd server && npm run dev</code></li>
                  <li>Check if port 5000 is listening: <code>netstat -an | find "5000"</code></li>
                  <li>Try accessing: <a href="http://localhost:5000/api/test" target="_blank" rel="noreferrer" className="text-blue-500">http://localhost:5000/api/test</a></li>
                  <li>Check Windows Firewall settings</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTest;