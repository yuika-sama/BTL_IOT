import React from 'react'
import {User, Bot, CheckCircle, XCircle, AlertCircle, Loader} from 'lucide-react';
import {formatName} from '../../utils/formatter.js';

export default function Table({ data = [], columns = [], }) {
    const getCritical = (level) => {
        const levels = {
            'medium': {
                text: 'Critical', 
                color: 'bg-red-50 text-red-600',
                icon: <XCircle size={16} className="text-red-600" />
            },
            'high': {
                text: 'Warning', 
                color: 'bg-orange-50 text-orange-600',
                icon: <AlertCircle size={16} className="text-orange-600" />
            },
            'normal': {
                text: 'Info', 
                color: 'bg-blue-50 text-blue-600',
                icon: <AlertCircle size={16} className="text-blue-600" />
            },
        }
        const badge = levels[level.toLowerCase()] || levels['info'];
        return (
            <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${badge.color}`}>
                {badge.icon}
                <span>{badge.text}</span>
            </span>
        )
    }

    const getActionBadge = (action) => {
        const badges = {
            'on': {text: 'Bật', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16} />},
            'off': {text: 'Tắt', color: 'bg-gray-100 text-gray-500', icon: <XCircle size={16} />},
        }
        const badge = badges[action.toLowerCase()] || badges['off'];
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${badge.color}`}>
                {badge.icon}
                <span className="ml-1">{badge.text}</span>
            </span>
        )
    }

    const getStatusIcon = (status) => {
        const icons = {
            'success': <CheckCircle size={20} className="text-green-500" />,
            'error': <XCircle size={20} className="text-red-500" />,
            'pending': <AlertCircle size={20} className="text-yellow-500" />,
            'waiting': <Loader size={20} className="text-gray-500" />,
        }
        return icons[status.toLowerCase()] || icons['error'];
    }

    const getExecutorInfo = (executor) => {
        const isAuto = executor.toLowerCase() === 'auto' || executor.toLowerCase() === 'system' || executor.toLowerCase() === 'bot' || executor.toLowerCase() === 'automation';
        return (
            <div className='flex items-center gap-2 font-medium'>
                {isAuto ? (
                    <Bot size={16} className="text-gray-500" />
                ) : (
                    <User size={16} className="text-gray-500" />
                )}
                <span className="text-gray-700">{formatName(executor)}</span>
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
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            {columns.map((column) => (
                                <th 
                                    key={column.key}
                                    className={`px-6 py-4 bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider ${column.headerClassName || 'text-left'}`}
                                >
                                    {column.header}
                                    {column.sortable && ' ↓'}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, rowIndex) => (
                            <tr key={row.id || rowIndex} className="hover:bg-gray-50 transition-colors">
                                {columns.map((column) => (
                                    <td 
                                        key={column.id}
                                        className={`px-6 py-4 text-sm ${column.cellClassName || ''}`}
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
                <div className="text-center py-12 text-gray-500 font-medium">
                    Không có dữ liệu
                </div>
            )}
        </div>
    )
}