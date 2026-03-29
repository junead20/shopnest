import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaMagic } from 'react-icons/fa';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const toastIdCounter = useRef(0);

    const showToast = useCallback((message, type = 'success', duration = 4000) => {
        const id = ++toastIdCounter.current;
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 pointer-events-none max-w-md w-full sm:w-auto">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem = ({ message, type, onRemove, duration }) => {
    const icons = {
        success: <FaCheckCircle className="text-emerald-500" />,
        error: <FaExclamationCircle className="text-rose-500" />,
        info: <FaInfoCircle className="text-indigo-500" />,
        warning: <FaExclamationCircle className="text-amber-500" />,
        magic: <FaMagic className="text-purple-500" />
    };

    const gradientColors = {
        success: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
        error: 'from-rose-500/10 to-rose-600/5 border-rose-500/20',
        info: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20',
        warning: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
        magic: 'from-purple-500/10 to-purple-600/5 border-purple-500/20'
    };

    const progressColors = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        info: 'bg-indigo-500',
        warning: 'bg-amber-500',
        magic: 'bg-purple-500'
    };

    return (
        <div 
            className={`pointer-events-auto relative overflow-hidden bg-white/80 backdrop-blur-xl border ${gradientColors[type]} p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-start gap-4 animate-slide-in-right group min-w-[320px]`}
        >
            <div className="mt-1 text-xl drop-shadow-sm">
                {icons[type]}
            </div>
            
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 leading-relaxed capitalize mb-1">
                    {type === 'magic' ? 'AI Stylist Message' : type}
                </p>
                <p className="text-[13px] font-medium text-slate-600 leading-snug">
                    {message}
                </p>
            </div>

            <button 
                onClick={onRemove}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
                <FaTimes size={14} />
            </button>

            {/* Progress Bar Animation */}
            <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-100/30">
                <div 
                    className={`h-full ${progressColors[type]} transition-all linear duration-[${duration}ms]`}
                    style={{ 
                        animation: `progress ${duration}ms linear forwards`,
                        width: '0%'
                    }}
                />
            </div>

            <style>{`
                @keyframes progress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div>
    );
};
