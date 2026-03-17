import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import dataSensorService from '../services/dataSensorService.jsx';
import {formatNumber, formatTime} from '../utils/formatter.js';

export default function DataSensor(){
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
        {type: 'temperature', displayText: 'Nhiệt độ'},
        {type: 'humidity', displayText: 'Độ ẩm'},
        {type: 'light', displayText: 'Ánh sáng'},
        {type: 'gas', displayText: 'Khí gas'},
        {type: 'time', displayText: 'Thời gian'},
    ]

    // Fetch data từ API
    useEffect(() => {
        fetchSensorHistory();
    }, [pagination.page, pagination.limit, filters]);

    const fetchSensorHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters
            };

            const response = await dataSensorService.getSensorHistory(params);
            
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
            console.error('Error fetching sensor history:', err);
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
        { key: 'id',header: 'ID', accessor: 'id', cellClassName:'font-medium'},
        { key: 'temperature', header: 'Nhiệt độ', accessor: 'temperature', render: (value) => (<span className="font-medium text-red-500">{formatNumber(value)}℃</span>)},
        { key: 'humidity', header: 'Độ ẩm', accessor: 'humidity', render: (value) => (<span className="font-medium text-blue-400">{formatNumber(value)}%</span>)},
        { key: 'light', header: 'Ánh sáng', accessor: 'light', render: (value) => (<span className="font-medium text-yellow-500">{formatNumber(value)} %(Lux)</span>)},
        { key: 'gas', header: 'Khí gas', accessor: 'gas', render: (value) => (<span className="font-medium text-gray-400">{formatNumber(value)} %(ppm)</span>)},
        { key: 'timestamp', header: 'Thời gian', accessor: 'timestamp', cellClassName:'', render: (value) => (<span className="text-sm text-gray-500">{formatTime(value)}</span>)},
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