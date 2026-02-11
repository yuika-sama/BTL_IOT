import React from 'react';
import TopBar from './InformationComponents/TopBar.jsx';
import Table from './InformationComponents/Table.jsx';
import Pagination from './InformationComponents/Pagination.jsx';

export default function InformationLayout({
    filterOptions = [], 
    columns = [], 
    data = [], 
    loading = false,
    error = null,
    pagination = { page: 1, limit: 10, total: 0, totalPages: 0 },
    onPageChange = () => {},
    onFilterChange = () => {},
    onSearch = () => {},
    onSort = () => {}
}) {
    return (
        <div className="min-h-screen">
            <TopBar 
                filterOptions={filterOptions} 
                onSearch={onSearch}
                onFilterChange={onFilterChange}
            />
            <div>
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-gray-500">Đang tải dữ liệu...</div>
                    </div>
                )}
                
                {error && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-red-500">Lỗi: {error}</div>
                    </div>
                )}
                
                {!loading && !error && (
                    <>
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
                        />
                    </>
                )}
            </div>
        </div>
    );
}