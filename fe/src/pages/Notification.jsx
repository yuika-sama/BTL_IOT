import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import alertService from '../services/alertService.jsx';
import { formatTime } from '../utils/formatter.js';

export default function Notifications(){
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        filter: 'all',
        order: 'desc'
    });

    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'name', displayText: 'Tên thiết bị'},
        {type: 'severity', displayText: 'Độ nghiêm trọng'},
        {type: 'title', displayText: 'Tiêu đề'},
        {type: 'description', displayText: 'Nội dung'},
        {type: 'time', displayText: 'Thời gian'},
    ]

    // Fetch data từ API
    useEffect(() => {
        fetchAlerts();
    }, [pagination.page, pagination.limit, filters]);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            };

            const response = await alertService.getAll(params);
            
            if (response.success) {
                setData(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    totalPages: response.data.pagination.totalPages
                }));
            }
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleLimitChange = (newLimit) => {
        setPagination(prev => ({
            ...prev,
            page: 1,
            limit: newLimit
        }));
    };

    const handleFilterChange = (filterType) => {
        setFilters(prev => ({ 
            ...prev, 
            filter: filterType
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSearch = (searchValue, filterType) => {
        setFilters(prev => ({ 
            ...prev, 
            search: searchValue,
            filter: filterType || prev.filter
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (sortOrder) => {
        setFilters(prev => ({ 
            ...prev, 
            order: sortOrder
        }));
    };

    const columns = [
        { 
            key: 'id',
            header: 'ID', 
            accessor: 'id',
            cellClassName: 'font-medium',
            render: (value, row) => {
                const currentIndex = data.findIndex(item => item.id === row.id);
                const stt = (pagination.page - 1) * pagination.limit + currentIndex + 1;
                return (<span className="text-sm text-gray-500">{stt}</span>);
            }
        },
        { 
            key: 'severity',
            header: 'Độ nghiêm trọng', 
            accessor: 'severity',
            type: 'severity',
            headerClassName: 'text-center',
            cellClassName: 'text-center'
        },
        { 
            key: 'device_name', 
            header: 'Tên thiết bị', 
            accessor: 'device_name',
        },
        { 
            key: 'timestamp', 
            header: 'Thời gian', 
            accessor: 'timestamp',
            render: (value) => (<span className="text-sm text-gray-500">{formatTime(value)}</span>)
        },
        { 
            key: 'notification', 
            header: 'Thông báo', 
            accessor: 'title',
            render: (value, row) => (
                <div className="flex flex-col gap-1">
                    <div className="font-medium text-gray-800">{row.title}</div>
                    <div className="text-gray-700">{row.description}</div>
                </div>
            )
        },
    ]
    
    return(
        <MainLayout>
            <InformationLayout
                filterOptions={filterOptions}
                columns={columns}
                data={data}
                loading={loading}
                error={error}
                pagination={pagination}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onSort={handleSort}
            />
        </MainLayout>
    )
}