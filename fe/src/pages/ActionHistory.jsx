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
        { 
            key: 'id',
            header: 'ID', 
            accessor: 'id',
            cellClassName: 'font-semibold'
        },
        { 
            key: 'deviceName', 
            header: 'Tên thiết bị', 
            accessor: 'deviceName',
            render: (value) => (
                <span className="">{value}</span>
            )
        },
        { 
            key: 'action', 
            header: 'Hành động', 
            accessor: 'action',
            type: 'action',
            headerClassName: 'text-center',
            cellClassName: 'text-center'

        },
        { 
            key: 'status', 
            header: 'Trạng thái', 
            accessor: 'status',
            type: 'status',
            headerClassName: 'text-center',
            cellClassName: 'flex justify-center'
        },
        { 
            key: 'executor', 
            header: 'Thực thi bởi', 
            accessor: 'executor',
            type: 'executor',
            },
        { 
            key: 'timestamp', 
            header: 'Thời gian', 
            accessor: 'timestamp',
            render: (value) => (
                <span className="text-gray-600">{value}</span>
            ),
            sortable: true
        },
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