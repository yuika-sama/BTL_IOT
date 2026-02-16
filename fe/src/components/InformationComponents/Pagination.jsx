import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ 
    currentPage = 1, 
    totalPages = 1, 
    totalItems = 0,
    itemsPerPage = 10,
    onPageChange 
}) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Hiển thị tất cả pages nếu ít hơn maxVisiblePages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Luôn hiển thị trang đầu
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Hiển thị các trang xung quanh trang hiện tại
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Luôn hiển thị trang cuối
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onPageChange?.(page);
        }
    };

    return (
        <div className="flex items-center justify-between mt-4 px-8 py-5 bg-white border border-gray-100 rounded-3xl shadow-lg transition-shadow duration-300 hover:shadow-xl">
            {/* Info text */}
            <div className="text-sm font-medium text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                Hiển thị <span className="font-bold text-blue-600">{startItem}-{endItem}</span> của <span className="font-bold text-blue-600">{totalItems}</span> bản ghi
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1.5">
                {/* Previous button */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                        currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                    }`}
                >
                    <ChevronLeft size={20} />
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-3 py-2 text-gray-400 font-medium"
                            >
                                ...
                            </span>
                        );
                    }

                    return (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[42px] px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                                currentPage === page
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm'
                            }`}
                        >
                            {page}
                        </button>
                    );
                })}

                {/* Next button */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                        currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md'
                    }`}
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}