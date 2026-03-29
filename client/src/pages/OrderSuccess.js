// client/src/pages/OrderSuccess.js
import React, { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaCheckCircle, FaBox, FaArrowRight, FaHome } from 'react-icons/fa';
import gsap from 'gsap';

const OrderSuccess = () => {
    const { id } = useParams();
    const containerRef = useRef(null);
    const checkRef = useRef(null);
    const textRef = useRef(null);
    const cardRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();

        tl.fromTo(checkRef.current, 
            { scale: 0, opacity: 0 }, 
            { scale: 1.2, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
        )
        .to(checkRef.current, { scale: 1, duration: 0.2 })
        .fromTo(textRef.current.children, 
            { y: 20, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.2, ease: "power2.out" },
            "-=0.2"
        )
        .fromTo(cardRef.current,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
            "-=0.4"
        );
    }, []);

    return (
        <div ref={containerRef} className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div ref={checkRef} className="inline-block mb-6">
                    <FaCheckCircle className="text-8xl text-green-500 bg-white rounded-full shadow-2xl shadow-green-200" />
                </div>
                
                <div ref={textRef} className="mb-10">
                    <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">Payment Successful!</h1>
                    <p className="text-gray-500 text-lg font-medium">Your order has been confirmed and is now being prepared for shipment.</p>
                </div>

                <div ref={cardRef} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-8 transform">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                        <div className="text-left">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
                            <p className="font-mono font-bold text-gray-800">#{id?.slice(-8).toUpperCase()}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <FaBox size={24} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Link 
                            to={`/order/${id}`}
                            className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-4 rounded-2xl font-bold hover:bg-yellow-600 transition-all shadow-lg shadow-yellow-200"
                        >
                            Track My Order <FaArrowRight />
                        </Link>
                        <Link 
                            to="/"
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                            <FaHome /> Continue Shopping
                        </Link>
                    </div>
                </div>

                <p className="text-gray-400 text-sm">A confirmation email has been sent to your registered address.</p>
            </div>
        </div>
    );
};

export default OrderSuccess;
