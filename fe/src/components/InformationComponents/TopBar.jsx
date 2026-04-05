import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function TopBar({
    filterOptions = [],
    extraFilterConfigs = [],
    onSearch,
    onFilterChange,
    onSort,
    searchPlaceholder = 'Tìm kiếm theo: Tên, thời gian(giờ, phút, giây), giá trị,...',
    searchOnType = false,
    forceSearchFilter = null,
    sortLabel = 'Sắp xếp',
    defaultSortOrder = 'desc'
}) {
    const [searchValue, setSearchValue] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState(defaultSortOrder);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const onSearchRef = useRef(onSearch);
    const hasMountedSearchOnType = useRef(false);

    useEffect(() => {
        setSortOrder(defaultSortOrder);
    }, [defaultSortOrder]);

    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => {
        if (!searchOnType || !onSearchRef.current) {
            return;
        }

        if (!hasMountedSearchOnType.current) {
            hasMountedSearchOnType.current = true;
            return;
        }

        const timeoutId = setTimeout(() => {
            onSearchRef.current(searchValue, forceSearchFilter || selectedFilter);
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [searchOnType, searchValue, selectedFilter, forceSearchFilter]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchValue(value);
    };

    const handleSearch = () => {
        if (onSearchRef.current) {
            onSearchRef.current(searchValue, forceSearchFilter || selectedFilter);
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

    const isMainFilterVisible = filterOptions.length > 0;

    return (
        <div className="flex flex-wrap items-center gap-4 p-4">
            {/* Search Bar and Filter */}
            <div className="flex-1 min-w-[300px] flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchValue}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        placeholder={searchPlaceholder}
                        className="w-full pl-12 pr-20 py-3 bg-white border border-gray-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    {/* <button
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors text-sm font-medium"
                    >
                        Tìm
                    </button> */}
                </div>

                {/* Filter Dropdown */}
                {isMainFilterVisible && (
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
                            <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-100 rounded-2xl shadow-xl py-2 min-w-[140px] z-20 backdrop-blur-sm">
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
                                        className="w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-150 font-medium text-gray-700 first:rounded-t-xl last:rounded-b-xl"
                                    >
                                        {option.displayText}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Extra Filters */}
            {extraFilterConfigs.map((config) => {
                const selectedOption = config.options?.find((opt) => opt.value === config.value);

                return (
                    <div className="relative" key={config.key}>
                        <select
                            value={config.value}
                            onChange={(event) => config.onChange?.(event.target.value)}
                            className="appearance-none px-4 py-3 pr-9 bg-white border border-gray-200 rounded-3xl hover:bg-blue-50 transition-colors min-w-[160px] shadow-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {config.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        {/* {selectedOption?.label && (
                            <span className="absolute -top-2 left-4 px-2 text-xs bg-white text-gray-500">
                                {config.label}
                            </span>
                        )} */}
                    </div>
                );
            })}

            {/* Sort Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="group flex items-center gap-2 px-5 py-3.5 bg-white border-2 border-gray-200 rounded-3xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 min-w-[160px] shadow-lg hover:shadow-xl"
                >
                    <span className="group-hover:text-blue-700 text-gray-700 font-medium">
                        {sortLabel}: {sortOptions.find(opt => opt.value === sortOrder)?.label}
                    </span>
                    <ChevronDown size={16} className={`group-hover:text-blue-600 text-gray-500 transition-all duration-300 ${showSortDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSortDropdown && (
                    <div className="absolute top-full mt-2 right-0 bg-white border-2 border-gray-100 rounded-2xl shadow-xl py-2 min-w-[160px] z-10 backdrop-blur-sm">
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
                                className="w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-150 font-medium text-gray-700 first:rounded-t-xl last:rounded-b-xl"
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