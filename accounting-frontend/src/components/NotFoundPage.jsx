// src/components/NotFoundPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiHome, FiArrowLeft } from 'react-icons/fi';

/**
 * 404 Not Found Page
 * Displays when user navigates to a route that doesn't exist
 */
export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-md w-full text-center">
                {/* 404 Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center">
                            <FiAlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-orange-600">404</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                    Page Not Found
                </h1>
                <p className="text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                    Please check the URL or navigate back to the dashboard.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        <FiHome className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-3">Quick Links:</p>
                    <div className="flex flex-wrap gap-4 justify-center text-sm">
                        <button
                            onClick={() => navigate('/items')}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Items
                        </button>
                        <button
                            onClick={() => navigate('/customer')}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Customers
                        </button>
                        <button
                            onClick={() => navigate('/sales')}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Sales
                        </button>
                        <button
                            onClick={() => navigate('/purchase')}
                            className="text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Purchase
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
