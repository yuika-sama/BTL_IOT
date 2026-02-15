import React, { useState, useEffect } from 'react';
import InformationLayout from '../components/InformationLayout.jsx';
import MainLayout from '../components/MainLayout.jsx';
import actionHistoryService from '../services/actionHistoryService.jsx';
import {formatName, formatTime} from '../utils/formatter.js';

export default function ActionHistory(){
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
        filterType: 'all',
        deviceId: '',
        action: '',
        status: '',
        sortBy: 'timestamp',
        sortOrder: 'desc'
    });

    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'name', displayText: 'Tên thiết bị'},
        {type: 'action', displayText: 'Hành động'},
        {type: 'status', displayText: 'Trạng thái'},
        {type: 'user', displayText: 'Thực thi bởi'},
        {type: 'time', displayText: 'Thời gian'},
    ]

    // Fetch data từ API
    useEffect(() => {
        fetchActionHistory();
    }, [pagination.page, pagination.limit, filters]);

    const fetchActionHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
                filterType: filters.filterType === 'all' ? '' : filters.filterType
            };

            const response = await actionHistoryService.getAll(params);
            
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
            console.error('Error fetching action history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (filterType) => {
        setFilters(prev => ({ ...prev, filterType: filterType }));
        console.log('Filter changed to:', filterType);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSearch = (searchValue, filterType) => {
        setFilters(prev => ({ 
            ...prev, 
            search: searchValue,
            filterType: filterType || prev.filterType
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (sortOrder) => {
        setFilters(prev => ({ 
            ...prev, 
            sortOrder: sortOrder
        }));
    };

    console.log(data)

    const renderAction = (value, row) => {
        // Kiểm tra nếu là hành động auto_toggle
        if (row.auto_toggle) {
            const isEnable = row.auto_toggle === 'ENABLE_AUTO';
            return (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    isEnable 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-200 text-gray-700'
                }`}>
                    {isEnable ?  'Bật tự động' : 'Tắt tự động'}
                </span>
            );
        }
        
        // Hành động bật/tắt thủ công bình thường
        const isOn = value?.toLowerCase() === 'on';
        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                isOn 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-500'
            }`}>
                {isOn ? '✓ Bật' : '✕ Tắt'}
            </span>
        );
    };

    const columns = [
        { 
            key: 'id',
            header: 'ID', 
            accessor: 'id',
            cellClassName: 'font-semibold',
            render: (value, row) => {
                const currentIndex = data.findIndex(item => item.id === row.id);
                const stt = (pagination.page - 1) * pagination.limit + currentIndex + 1;
                return (<span className="text-sm text-gray-500">{stt}</span>);
            }
        },
        { 
            key: 'device_name', 
            header: 'Tên thiết bị', 
            accessor: 'device_name',
            render: (value) => (
                <span className="">{value}</span>
            )
        },
        { 
            key: 'value', 
            header: 'Hành động', 
            accessor: 'value',
            render: renderAction,
            headerClassName: 'text-center',
            cellClassName: 'text-center'
        },
        { 
            key: 'status', 
            header: 'Trạng thái', 
            accessor: 'status',
            type: 'status',
            headerClassName: 'text-center',
            cellClassName: 'flex justify-center'
        },
        { 
            key: 'executor', 
            header: 'Thực thi bởi', 
            accessor: 'executor',
            type: 'executor',   
            
        },
        { 
            key: 'timestamp', 
            header: 'Thời gian', 
            accessor: 'timestamp',
            render: (value) => (
                <span className="text-gray-600">{formatTime(value)}</span>
            ),
            sortable: true
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
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onSort={handleSort}
            />
        </MainLayout>
    )
}