import React from 'react'
import {User, Bot, CheckCircle, XCircle, AlertCircle, Loader, Database} from 'lucide-react';
import {formatName} from '../../utils/formatter.js';

export default function Table({ data = [], columns = [], }) {
    const getCritical = (level) => {
        if (!level) return null; // Handle null/undefined
        
        const levels = {
            'high': {
                text: 'Nghiêm trọng', 
                color: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200/50 shadow-sm',
                icon: <XCircle size={16} className="text-red-600" />
            },
            'medium': {
                text: 'Cảnh báo', 
                color: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200/50 shadow-sm',
                icon: <AlertCircle size={16} className="text-orange-600" />
            },
            'low': {
                text: 'Thông tin', 
                color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200/50 shadow-sm',
                icon: <AlertCircle size={16} className="text-blue-600" />
            },
            'normal': {
                text: 'Bình thường', 
                color: 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200/50 shadow-sm',
                icon: <CheckCircle size={16} className="text-green-600" />
            },
            'critical': {
                text: 'Nguy hiểm', 
                color: 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200/50 shadow-sm',
                icon: <XCircle size={16} className="text-purple-600" />
            },
        }
        const badge = levels[level.toLowerCase()] || levels['low'];
        return (
            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${badge.color}`}>
                {badge.icon}
                <span>{badge.text}</span>
            </span>
        )
    }

    const getActionBadge = (action) => {
        if (!action) return null; // Handle null/undefined
        
        const badges = {
            'on': {text: 'Bật', color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300/50 shadow-sm'},
            'off': {text: 'Tắt', color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 border border-gray-300/50 shadow-sm'},
        }
        const badge = badges[action.toLowerCase()] || badges['off'];
        return (
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 ${badge.color}`}>
                {badge.text}
            </span>
        )
    }

    const getStatusIcon = (status) => {
        if (!status) return null; // Handle null/undefined
        
        const icons = {
            'success': <div className="p-1.5 bg-green-100 rounded-lg"><CheckCircle size={18} className="text-green-600" /></div>,
            'error': <div className="p-1.5 bg-red-100 rounded-lg"><XCircle size={18} className="text-red-600" /></div>,
            'pending': <div className="p-1.5 bg-yellow-100 rounded-lg"><AlertCircle size={18} className="text-yellow-600" /></div>,
            'waiting': <div className="p-1.5 bg-gray-100 rounded-lg"><Loader size={18} className="text-gray-600 animate-spin" /></div>,
        }
        return icons[status.toLowerCase()] || icons['error'];
    }

    const getExecutorInfo = (executor) => {
        if (!executor) return null; // Handle null/undefined
        
        const isAuto = executor.toLowerCase() === 'auto' || executor.toLowerCase() === 'system' || executor.toLowerCase() === 'bot' || executor.toLowerCase() === 'automation';
        return (
            <div className='flex items-center gap-2.5 font-medium'>
                <div className={`p-1.5 rounded-lg ${isAuto ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    {isAuto ? (
                        <Bot size={16} className="text-purple-600" />
                    ) : (
                        <User size={16} className="text-blue-600" />
                    )}
                </div>
                <span className="text-gray-800">{formatName(executor)}</span>
            </div>
        )
    }

    const renderCellContent = (row, column) => {
        const value = row[column.key];

        // Nếu column có render function tùy chỉnh
        if (column.render) {
            return column.render(value, row);
        }

        // Xử lý các type đặc biệt
        switch (column.type) {
            case 'device_name': 
                return <span className="font-medium text-gray-900">{formatName(value)}</span>;
            case 'action':
                return getActionBadge(value);
            case 'status':
                return getStatusIcon(value);
            case 'executor':
                return getExecutorInfo(value);
            case 'critical':
                return getCritical(value);
            case 'severity':
                return getCritical(value);
            default:
                return <span className={column.className || 'text-gray-900'}>{value}</span>;
        }
    }
    
    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-shadow duration-300 hover:shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-gray-200">
                            {columns.map((column) => (
                                <th 
                                    key={column.key}
                                    className={`px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 text-xs font-extrabold text-gray-700 uppercase tracking-wider ${column.headerClassName || 'text-left'}`}
                                >
                                    {column.header}
                                    {column.sortable && ' ↓'}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, rowIndex) => (
                            <tr key={row.id || rowIndex} className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 group">
                                {columns.map((column) => (
                                    <td 
                                        key={column.id}
                                        className={`px-6 py-5 text-sm ${column.cellClassName || ''}`}
                                    >
                                        {renderCellContent(row, column)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {data.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <Database size={48} className="text-gray-300 mb-4" />
                    <p className="text-lg font-semibold text-gray-600">Không có dữ liệu</p>
                    <p className="text-sm text-gray-400 mt-1">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                </div>
            )}
        </div>
    )
}