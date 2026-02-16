import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import dataSensorService from '../services/dataSensorService.jsx';
import {formatNumber} from '../utils/formatter.js';

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
        filterType: 'all',
        sensorType: '',
        sortBy: 'timestamp',
        sortOrder: 'desc'
    });

    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'temperature', displayText: 'Nhiệt độ'},
        {type: 'humidity', displayText: 'Độ ẩm'},
        {type: 'light', displayText: 'Ánh sáng'},
        {type: 'dust', displayText: 'Bụi mịn'},
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
                ...filters,
                filterType: filters.filterType === 'all' ? '' : filters.filterType
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

    const handleFilterChange = (filterType) => {
        // Xác định sortBy dựa trên filterType mới
        let sortBy = 'timestamp'; // Mặc định sắp xếp theo thời gian
        
        if (filterType !== 'all' && filterType !== 'time') {
            const sortByMapping = {
                'name': 'sensor_name',
                'temperature': 'temperature',
                'humidity': 'humidity',
                'light': 'light',
                'dust': 'dust'
            };
            sortBy = sortByMapping[filterType] || 'timestamp';
        }
        
        setFilters(prev => ({ 
            ...prev, 
            filterType: filterType,
            sortBy: sortBy
        }));
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
        // Xác định sortBy dựa trên filterType hiện tại
        let sortBy = 'timestamp'; // Mặc định sắp xếp theo thời gian
        
        // Nếu filterType không phải 'all' hoặc 'time', có thể sort theo field đó
        if (filters.filterType !== 'all' && filters.filterType !== 'time') {
            // Mapping filterType sang sortBy field cho sensor data
            const sortByMapping = {
                'temperature': 'temperature',
                'humidity': 'humidity',
                'light': 'light',
                'dust': 'dust'
            };
            sortBy = sortByMapping[filters.filterType] || 'timestamp';
        }
        
        setFilters(prev => ({ 
            ...prev, 
            sortOrder: sortOrder,
            sortBy: sortBy
        }));
    };

    const columns = [
        { key: 'id',header: 'ID', accessor: 'id', cellClassName:'font-medium'},
        { key: 'temperature', header: 'Nhiệt độ', accessor: 'temperature', render: (value) => (<span className="font-medium text-red-500">{formatNumber(value)}℃</span>)},
        { key: 'humidity', header: 'Độ ẩm', accessor: 'humidity', render: (value) => (<span className="font-medium text-blue-400">{formatNumber(value)}%</span>)},
        { key: 'light', header: 'Ánh sáng', accessor: 'light', render: (value) => (<span className="font-medium text-yellow-500">{formatNumber(value)} Lux</span>)},
        { key: 'dust', header: 'Bụi mịn', accessor: 'dust', render: (value) => (<span className="font-medium text-gray-400">{formatNumber(value)    }µg/m³</span>)},
        { key: 'timestamp', header: 'Thời gian', accessor: 'timestamp', cellClassName:'', render: (value) => (<span className="text-sm text-gray-500">{new Date(value).toLocaleString()}</span>)},
    ]
    console.log(data)
    
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