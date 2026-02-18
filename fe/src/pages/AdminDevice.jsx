 import React, { useState, useEffect } from 'react';
import InformationLayout from '../components/InformationLayout.jsx';
import MainLayout from '../components/MainLayout.jsx';
import deviceService from '../services/deviceService.jsx';
import { formatTime } from '../utils/formatter.js';

export default function AdminDevice() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        status: false,
        is_connected: false
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
        { type: 'name', displayText: 'Tên thiết bị' },
        { type: 'type', displayText: 'Loại' },
        { type: 'status', displayText: 'Trạng thái' }
    ];

    useEffect(() => {
        fetchDevices();
    }, [pagination.page, pagination.limit, filters]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
                filterType: filters.filterType === 'all' ? '' : filters.filterType
            };

            const response = await deviceService.getAll(params);

            if (response.success) {
                setData(response.data || []);
                setPagination(prev => ({
                    ...prev,
                    total: response.pagination?.totalItems || 0,
                    totalPages: response.pagination?.totalPages || 0
                }));
            }
        } catch (err) {
            console.error('Error fetching devices:', err);
            setError(err.message || 'Không thể tải danh sách thiết bị');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingDevice(null);
        setFormData({
            name: '',
            type: '',
            status: false,
            is_connected: false
        });
        setShowModal(true);
    };

    const handleViewDetail = (device) => {
        setSelectedDevice(device);
        setShowDetailModal(true);
    };

    const handleEdit = (device) => {
        setEditingDevice(device);
        setFormData({
            name: device.name || '',
            type: device.type || '',
            status: device.status || false,
            is_connected: device.is_connected || false
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa thiết bị này?')) return;

        try {
            await deviceService.delete(id);
            fetchDevices();
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingDevice) {
                await deviceService.update(editingDevice.id, formData);
            } else {
                await deviceService.create(formData);
            }
            setShowModal(false);
            fetchDevices();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const columns = [
        {
            key: 'id',
            label: 'Device ID',
            render: (value) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-600">{value}</span>
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(value);
                            alert('Đã copy ID!');
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
            label: 'Tên thiết bị',
            render: (value, row) => (
                <div className="font-medium">{value || 'N/A'}</div>
            )
        },
        {
            key: 'type',
            label: 'Loại',
            render: (value) => value || 'N/A'
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (value) => (
                <span className={`px-2 py-1 rounded text-sm ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {value ? 'ON' : 'OFF'}
                </span>
            )
        },
        {
            key: 'is_connected',
            label: 'Kết nối',
            render: (value) => (
                <span className={`px-2 py-1 rounded text-sm ${value ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                    {value ? 'Đang kết nối' : 'Ngắt kết nối'}
                </span>
            )
        },
        {
            key: 'auto_toggle',
            label: 'Auto Mode',
            render: (value) => (
                <span className={`px-2 py-1 rounded text-sm ${value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {value ? 'ON' : 'OFF'}
                </span>
            )
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
                title="Quản lý Thiết bị"
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
                    Thêm thiết bị mới
                </button>
            </InformationLayout>

            {/* Detail Modal */}
            {showDetailModal && selectedDevice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Chi tiết Thiết bị</h2>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Device ID</label>
                                <div className="flex items-center gap-2">
                                    <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1 font-mono break-all">
                                        {selectedDevice.id}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(selectedDevice.id);
                                            alert('Đã copy Device ID!');
                                        }}
                                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                            </div>
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Tên thiết bị</label>
                                <p className="text-lg">{selectedDevice.name || 'N/A'}</p>
                            </div>
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Loại</label>
                                <p className="text-lg">{selectedDevice.type || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-b pb-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Trạng thái</label>
                                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                        selectedDevice.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {selectedDevice.status ? '🟢 ON' : '⚫ OFF'}
                                    </span>
                                </div>
                                <div className="border-b pb-3">
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Kết nối</label>
                                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                        selectedDevice.is_connected ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {selectedDevice.is_connected ? '🔗 Đang kết nối' : '❌ Ngắt kết nối'}
                                    </span>
                                </div>
                            </div>
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Auto Mode</label>
                                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                    selectedDevice.auto_toggle ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {selectedDevice.auto_toggle ? '🤖 ON' : '⚙️ OFF'}
                                </span>
                            </div>
                            <div className="border-b pb-3">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Giá trị hiện tại</label>
                                <p className="text-lg font-mono">{selectedDevice.value !== undefined ? selectedDevice.value : 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Ngày tạo</label>
                                    <p className="text-sm">{formatTime(selectedDevice.created_at)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Cập nhật lần cuối</label>
                                    <p className="text-sm">{formatTime(selectedDevice.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end mt-6 pt-4 border-t">
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedDevice);
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
                            {editingDevice ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Tên thiết bị</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Loại</label>
                                <input
                                    type="text"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="VD: LED, FAN, etc."
                                />
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Trạng thái ON</span>
                                </label>
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_connected}
                                        onChange={(e) => setFormData({ ...formData, is_connected: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium">Đang kết nối</span>
                                </label>
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
                                    {editingDevice ? 'Cập nhật' : 'Tạo mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
