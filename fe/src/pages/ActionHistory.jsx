import React, { useState, useEffect } from 'react';
import InformationLayout from '../components/InformationLayout.jsx';
import MainLayout from '../components/MainLayout.jsx';
import actionHistoryService from '../services/actionHistoryService.js';
import { formatTime } from '../utils/formatter.js';
import { normalizeSensorLevel, createBackgroundTheme } from '../utils/themeUtils.js';
import {
    ACTION_HISTORY_FILTER_OPTIONS,
    ACTION_HISTORY_ACTION_OPTIONS,
    ACTION_HISTORY_STATUS_OPTIONS,
    ACTION_HISTORY_EXECUTOR_OPTIONS
} from '../utils/mappings.js';

import DeviceActionStatsChart from '../components/DeviceActionStatsChart.jsx';

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
        sensorFilter: 'all',
        actionFilter: 'all',
        statusFilter: 'all',
        executorFilter: 'all',
        order: 'desc'
    });

    // Mock sensor data for background overlay
    const mockSensorData = {
        temperature: 32,
        humidity: 58,
        light: 85,
        gas: 35
    };

    const sensorLevels = {
        temperature: normalizeSensorLevel(mockSensorData.temperature, 0, 50),
        humidity: normalizeSensorLevel(mockSensorData.humidity, 0, 100),
        light: normalizeSensorLevel(mockSensorData.light, 0, 100),
        gas: normalizeSensorLevel(mockSensorData.gas, 0, 100)
    };

    const backgroundTheme = createBackgroundTheme(sensorLevels);

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
                search: filters.search,
                filter: 'time',
                sensorFilter: filters.sensorFilter,
                actionFilter: filters.actionFilter,
                statusFilter: filters.statusFilter,
                executorFilter: filters.executorFilter,
                order: filters.order
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
            console.error('Có lỗi xảy ra khi tải dữ liệu:', err);
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
            sensorFilter: filterType
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSearch = (searchValue) => {
        setFilters(prev => ({ 
            ...prev, 
            search: searchValue
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSort = (sortOrder) => {
        setFilters(prev => ({ 
            ...prev, 
            order: sortOrder
        }));
    };

    const handleActionFilterChange = (actionFilter) => {
        setFilters(prev => ({
            ...prev,
            actionFilter
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleStatusFilterChange = (statusFilter) => {
        setFilters(prev => ({
            ...prev,
            statusFilter
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleExecutorFilterChange = (executorFilter) => {
        setFilters(prev => ({
            ...prev,
            executorFilter
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const extraFilterConfigs = [
        {
            key: 'actionFilter',
            label: 'Hành động',
            value: filters.actionFilter,
            options: ACTION_HISTORY_ACTION_OPTIONS,
            onChange: handleActionFilterChange
        },
        {
            key: 'statusFilter',
            label: 'Trạng thái',
            value: filters.statusFilter,
            options: ACTION_HISTORY_STATUS_OPTIONS,
            onChange: handleStatusFilterChange
        },
        {
            key: 'executorFilter',
            label: 'Người thực hiện',
            value: filters.executorFilter,
            options: ACTION_HISTORY_EXECUTOR_OPTIONS,
            onChange: handleExecutorFilterChange
        }
    ];

    const renderAction = (value) => {
        const isOn = value?.toLowerCase() === 'on';
        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                isOn 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-500'
            }`}>
                {isOn ? 'Bật' : 'Tắt'}
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
        <MainLayout backgroundTheme={backgroundTheme}>
            <InformationLayout
                filterOptions={ACTION_HISTORY_FILTER_OPTIONS}
                extraFilterConfigs={extraFilterConfigs}
                columns={columns}
                data={data}
                loading={loading}
                error={error}
                pagination={pagination}
                searchPlaceholder="Tìm kiếm theo thời gian..."
                searchOnType={true}
                forceSearchFilter="time"
                sortLabel="Sắp xếp"
                defaultSortOrder="desc"
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                onFilterChange={handleFilterChange}
                onSearch={handleSearch}
                onSort={handleSort}
            />
        </MainLayout>
    )
}