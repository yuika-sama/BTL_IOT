import React from 'react';
import NavBar from '../components/NavBar.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import { sampleActionHistoryData } from '../utils/sampleData.js';

export default function ActionHistory(){
    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'name', displayText: 'Tên thiết bị'},
        {type: 'action', displayText: 'Hành động'},
        {type: 'status', displayText: 'Trạng thái'},
        {type: 'user', displayText: 'Thực thi bởi'},
        {type: 'time', displayText: 'Thời gian'},
    ]

    const columns = [
        { key: 'id',header: 'ID', accessor: 'id' },
        { key: 'deviceName', header: 'Tên thiết bị', accessor: 'deviceName' },
        { key: 'action', header: 'Hành động', accessor: 'action' },
        { key: 'status', header: 'Trạng thái', accessor: 'status' },
        { key: 'executor', header: 'Thực thi bởi', accessor: 'executor' },
        { key: 'timestamp', header: 'Thời gian', accessor: 'timestamp' },
    ]
    
    return(
        <div className="min-h-screen bg-gray-100">
            <div className='flex justify-center'>
                <NavBar />
            </div>
            <div className="max-w-6xl mx-auto p-6">
                <InformationLayout filterOptions={filterOptions} columns={columns} data={sampleActionHistoryData} />
            </div>
        </div>
    )
}