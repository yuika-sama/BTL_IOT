import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function TopBar({ filterOptions = [] }) {
    const [searchValue, setSearchValue] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('asc');
    const [timeUnit, setTimeUnit] = useState('hour');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        // Chỉ cho phép chữ cái, số và khoảng trắng
        if (/^[a-zA-Z0-9\s]*$/.test(value)) {
            setSearchValue(value);
        }
    };

    const timeUnits = [
        { value: 'second', label: 'Giây' },
        { value: 'minute', label: 'Phút' },
        { value: 'hour', label: 'Giờ' },
        { value: 'day', label: 'Ngày' },
        { value: 'month', label: 'Tháng' },
        { value: 'year', label: 'Năm' }
    ];

    const sortOptions = [
        { value: 'asc', label: 'Tăng dần' },
        { value: 'desc', label: 'Giảm dần' }
    ];

    // Kiểm tra xem filter hiện tại có phải là "Thời gian" không
    const isTimeFilter = selectedFilter === 'time';

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm">
            {/* Search Bar */}
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Tìm kiếm theo: Tên, thời gian(giờ, phút, giây), giá trị,..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-w-[140px]"
                >
                    <span className="text-gray-700">
                        {filterOptions.find(opt => opt.type === selectedFilter)?.displayText || 'Tất cả'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilterDropdown && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px] z-10">
                        {filterOptions.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => {
                                    setSelectedFilter(option.type);
                                    setShowFilterDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                                {option.displayText}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-w-[160px]"
                >
                    <span className="text-gray-700">
                        Sắp xếp: {sortOptions.find(opt => opt.value === sortOrder)?.label}
                    </span>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSortDropdown && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] z-10">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setSortOrder(option.value);
                                    setShowSortDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Time Unit Dropdown - Chỉ hiển thị khi filter là "Thời gian" */}
            {isTimeFilter && (
                <div className="relative">
                    <button
                        onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors min-w-[160px]"
                    >
                        <span className="text-gray-700">
                            Tìm kiếm theo: {timeUnits.find(unit => unit.value === timeUnit)?.label}
                        </span>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${showTimeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showTimeDropdown && (
                        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] z-10">
                            {timeUnits.map((unit) => (
                                <button
                                    key={unit.value}
                                    onClick={() => {
                                        setTimeUnit(unit.value);
                                        setShowTimeDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                                >
                                    {unit.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}