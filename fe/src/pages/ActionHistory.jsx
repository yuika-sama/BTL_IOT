import React from 'react';
import InformationLayout from '../components/InformationLayout.jsx';
import { sampleActionHistoryData } from '../utils/sampleData.js';
import MainLayout from '../components/MainLayout.jsx';

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
        <MainLayout>
            <InformationLayout
                filterOptions={filterOptions}
                columns={columns}
                data={sampleActionHistoryData}
            />
        </MainLayout>
    )
}