import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="text-center max-w-2xl">
                {/* Animated 404 */}
                <div className="relative mb-8">
                    <h1 className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 leading-none animate-pulse">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <SearchX className="text-gray-300" size={80} strokeWidth={1.5} />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-4 mb-10">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Oops! Trang không tồn tại
                    </h2>
                    <p className="text-gray-600 text-lg">
                        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-300 hover:shadow-lg transition-all duration-200 hover:scale-105"
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                        <Home size={20} />
                        Về trang chủ
                    </button>
                </div>

                {/* Decorative Elements */}
                <div className="mt-16 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
            </div>
        </div>
    );
}