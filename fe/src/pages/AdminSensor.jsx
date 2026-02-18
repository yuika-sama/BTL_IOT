import React, { useState, useEffect } from 'react';
import InformationLayout from '../components/InformationLayout.jsx';
import MainLayout from '../components/MainLayout.jsx';
import sensorService from '../services/sensorService.jsx';
import { formatTime } from '../utils/formatter.js';

export default function AdminSensor() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingSensor, setEditingSensor] = useState(null);
    const [selectedSensor, setSelectedSensor] = useState(null);
    const [formData, setFormData] = useState({
        device_id: '',
        name: '',
        type: '',
        unit: '',
        threshold_min: '',
        threshold_max: ''
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    const [filters, setFilters] = useState({
        search: '',
        filterType: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc'
    });

    const filterOptions = [
        { type: 'all', displayText: 'Tất cả' },
        { type: 'name', displayText: 'Tên cảm biến' },
        { type: 'unit', displayText: 'Đơn vị' },
        { type: 'device_id', displayText: 'ID thiết bị' }
    ];

    useEffect(() => {
        fetchSensors();
    }, [pagination.page, pagination.limit, filters]);

    const fetchSensors = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
                filterType: filters.filterType === 'all' ? '' : filters.filterType
            };

            const response = await sensorService.getAll(params);

            if (response.success) {
                setData(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.pagination?.totalItems || 0,
                    totalPages: response.pagination?.totalPages || 0
                }));
            }
        } catch (err) {
            console.error('Error fetching sensors:', err);
            setError(err.message || 'Không thể tải danh sách cảm biến');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingSensor(null);
        setFormData({
            device_id: '',
            name: '',
            type: '',
            unit: '',
            threshold_min: '',
            threshold_max: ''
        });
        setShowModal(true);
    };

    const handleViewDetail = (sensor) => {
        setSelectedSensor(sensor);
        setShowDetailModal(true);
    };

    const handleEdit = (sensor) => {
        setEditingSensor(sensor);
        setFormData({
            device_id: sensor.device_id || '',
            name: sensor.name || '',
            type: sensor.type || '',
            unit: sensor.unit || '',
            threshold_min: sensor.threshold_min || '',
            threshold_max: sensor.threshold_max || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa cảm biến này?')) return;

        try {
            await sensorService.delete(id);
            fetchSensors();
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const submitData = {
                ...formData,
                threshold_min: formData.threshold_min ? parseFloat(formData.threshold_min) : null,
                threshold_max: formData.threshold_max ? parseFloat(formData.threshold_max) : null
            };

            if (editingSensor) {
                await sensorService.update(editingSensor.id, submitData);
            } else {
                await sensorService.create(submitData);
            }
            setShowModal(false);
            fetchSensors();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'Sensor ID',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-600">
                        {value ? value.slice(0, 8) + '...' : 'N/A'}
                    </span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(value);
                            alert('Đã copy Sensor ID!');
                        }}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                        title="Copy ID"
                    >
                        📋
                    </button>
                </div>
            )
        },
        {
            key: 'name',
            label: 'Tên cảm biến',
            render: (value, row) => (
                <div className="font-medium">{value || 'N/A'}</div>
            )
        },
        {
            key: 'device_id',
            label: 'Device ID',
            render: (value) => (
                <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-gray-600">
                        {value ? value.slice(0, 8) + '...' : 'N/A'}
                    </span>
                    {value && (
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(value);
                                alert('Đã copy Device ID!');
                            }}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                            title="Copy Device ID"
                        >
                            📋
                        </button>
                    )}
                </div>
            )
        },
        {
            key: 'unit',
            label: 'Đơn vị',
            render: (value) => value || 'N/A'
        },
        {
            key: 'threshold_min',
            label: 'Ngưỡng Min',
            render: (value) => value !== null ? value : 'N/A'
        },
        {
            key: 'threshold_max',
            label: 'Ngưỡng Max',
            render: (value) => value !== null ? value : 'N/A'
        },
        {
            key: 'created_at',
            label: 'Ngày tạo',
            render: (value) => formatTime(value)
        },
        {
            key: 'actions',
            label: 'Thao tác',
            render: (_, row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleViewDetail(row)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        title="Xem chi tiết"
                    >
                        👁️
                    </button>
                    <button
                        onClick={() => handleEdit(row)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => handleDelete(row.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                        🗑️
                    </button>
                </div>
            )
        }
    ];

    return (
        <MainLayout>
            <InformationLayout
                title="Quản lý Cảm biến"
                columns={columns}
                data={data}
                loading={loading}
                error={error}
                pagination={pagination}
                setPagination={setPagination}
                filters={filters}
                setFilters={setFilters}
                filterOptions={filterOptions}
            >
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                >
                    <span>➕</span>
                    Thêm cảm biến mới
                </button>
            </InformationLayout>

            {/* Detail Modal */}
            {showDetailModal && selectedSensor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Chi tiết Cảm biến</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Sensor ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1 font-mono break-all">
                                        {selectedSensor.id}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedSensor.id);
                                            alert('Đã copy Sensor ID!');
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Device ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1 font-mono break-all">
                                        {selectedSensor.device_id || 'N/A'}
                                    </code>
                                    {selectedSensor.device_id && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedSensor.device_id);
                                                alert('Đã copy Device ID!');
                                            }}
                                            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            📋 Copy
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Tên cảm biến</label>
                                <p className="text-lg">{selectedSensor.name || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-b pb-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Đơn vị</label>
                                    <p className="text-lg font-mono">{selectedSensor.unit || 'N/A'}</p>
                                </div>
                                <div className="border-b pb-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Loại</label>
                                    <p className="text-lg">{selectedSensor.type || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-b pb-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Ngưỡng tối thiểu</label>
                                    <p className="text-lg font-mono">
                                        {selectedSensor.threshold_min !== null && selectedSensor.threshold_min !== undefined 
                                            ? selectedSensor.threshold_min 
                                            : 'Không có'}
                                    </p>
                                </div>
                                <div className="border-b pb-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Ngưỡng tối đa</label>
                                    <p className="text-lg font-mono">
                                        {selectedSensor.threshold_max !== null && selectedSensor.threshold_max !== undefined 
                                            ? selectedSensor.threshold_max 
                                            : 'Không có'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Ngày tạo</label>
                                    <p className="text-sm">{formatTime(selectedSensor.created_at)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Cập nhật lần cuối</label>
                                    <p className="text-sm">{formatTime(selectedSensor.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedSensor);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                ✏️ Chỉnh sửa
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingSensor ? 'Chỉnh sửa cảm biến' : 'Thêm cảm biến mới'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Device ID *</label>
                                <input
                                    type="text"
                                    value={formData.device_id}
                                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="UUID của thiết bị"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Tên cảm biến *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="VD: Temperature Sensor"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Loại cảm biến</label>
                                <input
                                    type="text"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="VD: temperature, humidity, light, dust"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Đơn vị *</label>
                                <input
                                    type="text"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="VD: °C, %, lux, µg/m³"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Ngưỡng Min</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.threshold_min}
                                    onChange={(e) => setFormData({ ...formData, threshold_min: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="Giá trị tối thiểu"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Ngưỡng Max</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.threshold_max}
                                    onChange={(e) => setFormData({ ...formData, threshold_max: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="Giá trị tối đa"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    {editingSensor ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
