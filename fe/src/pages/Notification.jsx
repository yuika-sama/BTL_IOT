import React from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import { sampleNotificationData } from '../utils/sampleData.js';

export default function Notifications(){
    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'name', displayText: 'Tên thiết bị'},
        {type: 'action', displayText: 'Hành động'},
        {type: 'time', displayText: 'Thời gian'},
    ]

    const columns = [
        { 
            key: 'critical',
            header: 'Độ nghiêm trọng', 
            accessor: 'critical',
            type: 'critical'
        },
        { 
            key: 'deviceName', 
            header: 'Tên thiết bị', 
            accessor: 'deviceName',
        },
        { 
            key: 'timestamp', 
            header: 'Thời gian', 
            accessor: 'timestamp',
        },
        { 
            key: 'description', 
            header: 'Thông báo', 
            accessor: 'description',
            render: (value) => (
                <div className="flex flex-col gap-1">
                    <div className="font-medium text-gray-800">{value.title}</div>
                    <div className="text-gray-700">{value.description}</div>
                </div>
            )
        },
    ]
    
    return(
        <MainLayout>
            <InformationLayout
                filterOptions={filterOptions}
                columns={columns}
                data={sampleNotificationData}
            />
        </MainLayout>
    )
}