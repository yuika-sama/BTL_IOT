import React from 'react';
import TopBar from './InformationComponents/TopBar.jsx';
import Table from './InformationComponents/Table.jsx';
import Pagination from './InformationComponents/Pagination.jsx';


export default function InformationLayout({
    title,
    filterOptions = [], 
    columns = [], 
    data = [], 
    loading = false,
    error = null,
    pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
    onPageChange,
    onLimitChange,
    onFilterChange,
    onSearch,
    onSort,
    children
}) {

    return (
        <div className="min-h-screen">
            {/* Header with title and action button */}
            <div className="flex justify-between items-center mb-4">
                {title && <h1 className="text-2xl font-bold text-gray-800">{title}</h1>}
                <div className="flex-shrink-0">
                    {children}
                </div>
            </div>
            
            <TopBar 
                filterOptions={filterOptions} 
                onSearch={onSearch}
                onFilterChange={onFilterChange}
                onSort={onSort}
            />
            <div className="mt-2">
                {loading && (
                    <div className="flex flex-col justify-center items-center py-24 bg-white rounded-3xl shadow-lg border border-gray-100">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-ping opacity-20"></div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium text-lg">Đang tải dữ liệu...</p>
                        <p className="mt-2 text-gray-400 text-sm">Vui lòng đợi trong giây lát</p>
                    </div>
                )}
                
                {error && (
                    <div className="flex flex-col justify-center items-center py-24 bg-gradient-to-br from-red-50 to-white rounded-3xl shadow-lg border border-red-100">
                        <div className="p-4 bg-red-100 rounded-full">
                            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="mt-6 text-red-600 font-semibold text-lg">Có lỗi xảy ra</p>
                        <p className="mt-2 text-red-500 text-sm">{error}</p>
                    </div>
                )}
                
                {!loading && !error && (
                    <div className="space-y-0">
                        <Table 
                            columns={columns} 
                            data={data}
                            onSort={onSort}
                        />
                        <Pagination 
                            currentPage={pagination.page} 
                            totalPages={pagination.totalPages} 
                            totalItems={pagination.total} 
                            itemsPerPage={pagination.limit} 
                            onPageChange={onPageChange} 
                            onLimitChange={onLimitChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}