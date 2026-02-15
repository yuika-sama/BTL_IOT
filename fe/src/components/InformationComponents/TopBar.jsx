import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function TopBar({ filterOptions = [], onSearch, onFilterChange, onSort }) {
    const [searchValue, setSearchValue] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch(searchValue, selectedFilter);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const sortOptions = [
        { value: 'asc', label: 'Tăng dần' },
        { value: 'desc', label: 'Giảm dần' }
    ];

    return (
        <div className="flex items-center gap-4 p-4">
            {/* Search Bar and Filter */}
            <div className="flex-1 flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Tìm kiếm theo: Tên, thời gian(giờ, phút, giây), giá trị,..."
                        className="w-full pl-12 pr-20 py-3 bg-white border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors text-sm font-medium"
                    >
                        Tìm
                    </button>
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="group flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-3xl hover:bg-blue-50 transition-colors min-w-[140px] shadow-lg"
                    >
                        <span className="text-gray-700 group-hover:text-blue-700">
                            {filterOptions.find(opt => opt.type === selectedFilter)?.displayText || 'Tất cả'}
                        </span>
                        <ChevronDown size={16} className={`text-gray-500 group-hover:text-blue-600 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showFilterDropdown && (
                        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-3xl shadow-lg py-1 min-w-[140px] z-10  shadow-lg">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.type}
                                    onClick={() => {
                                        setSelectedFilter(option.type);
                                        setShowFilterDropdown(false);
                                        if (onFilterChange) {
                                            onFilterChange(option.type);
                                        }
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-3xl"
                                >
                                    {option.displayText}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="group flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-3xl hover:bg-blue-50 transition-colors min-w-[160px] shadow-lg"
                >
                    <span className="group-hover:text-blue-700 text-gray-700">
                        Sắp xếp: {sortOptions.find(opt => opt.value === sortOrder)?.label}
                    </span>
                    <ChevronDown size={16} className={`group-hover:text-blue-600 text-gray-500 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSortDropdown && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-3xl shadow-lg py-1 min-w-[160px] z-10 shadow-lg">
                        {sortOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    setSortOrder(option.value);
                                    setShowSortDropdown(false);
                                    if (onSort) {
                                        onSort(option.value);
                                    }
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-3xl"
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}