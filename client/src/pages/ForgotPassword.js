import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [simulatedToken, setSimulatedToken] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return setError('Please enter your email');

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            setMessage(data.message);
            setSimulatedToken(data.resetToken); // In production this would be in an email
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password</h2>
                    <p className="text-sm text-gray-600">Enter your email and we'll send you a link to reset your password.</p>
                </div>

                {!submitted ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">{error}</div>}

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="h-5 w-5 text-gray-300" />
                            </div>
                            <input
                                type="email"
                                required
                                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-md transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                ) : (
                    <div className="mt-8 text-center animate-in fade-in zoom-in duration-300">
                        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Email Sent!</h3>
                        <p className="text-gray-600 mb-6">{message}</p>

                        {simulatedToken && (
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6 text-left">
                                <p className="text-xs font-bold uppercase text-yellow-700 mb-2">Demo Simulation Mode:</p>
                                <p className="text-sm text-gray-700 italic mb-3">Copy this token to use in the reset page:</p>
                                <code className="block bg-white p-2 text-xs border rounded select-all font-mono break-all">{simulatedToken}</code>
                                <Link to={`/reset-password/${simulatedToken}`} className="mt-3 block text-center text-sm font-bold text-yellow-600 hover:underline">Go to Reset Page →</Link>
                            </div>
                        )}

                        <Link to="/login" className="text-yellow-600 font-bold hover:underline">Back to Login</Link>
                    </div>
                )}

                {!submitted && (
                    <div className="text-center mt-6">
                        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-yellow-600 font-medium transition-colors">
                            <FaArrowLeft className="text-xs" /> Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
