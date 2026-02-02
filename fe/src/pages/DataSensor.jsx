import React from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import { sampleDataSensorData } from '../utils/sampleData.js';

export default function DataSensor(){
    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'name', displayText: 'Tên thiết bị'},
        {type: 'temperature', displayText: 'Nhiệt độ'},
        {type: 'humidity', displayText: 'Độ ẩm'},
        {type: 'light', displayText: 'Ánh sáng'},
        {type: 'dust', displayText: 'Bụi mịn'},
        {type: 'time', displayText: 'Thời gian'},
    ]

    const columns = [
        { key: 'id',header: 'ID', accessor: 'id', cellClassName:'font-medium'},
        { key: 'deviceName', header: 'Tên thiết bị', accessor: 'deviceName', cellClassName:'' },
        { key: 'temperature', header: 'Nhiệt độ', accessor: 'temperature', render: (value) => (<span className="font-medium text-red-500">{value}℃</span>)},
        { key: 'humidity', header: 'Độ ẩm', accessor: 'humidity', render: (value) => (<span className="font-medium text-blue-400">{value}%</span>)},
        { key: 'light', header: 'Ánh sáng', accessor: 'light', render: (value) => (<span className="font-medium text-yellow-500">{value} Lux</span>)},
        { key: 'dust', header: 'Bụi mịn', accessor: 'dust', render: (value) => (<span className="font-medium text-gray-400">{value}µg/m³</span>)},
        { key: 'timestamp', header: 'Thời gian', accessor: 'timestamp', cellClassName:'' },
    ]
    
    return(
        <MainLayout>
            <InformationLayout
                filterOptions={filterOptions}
                columns={columns}
                data={sampleDataSensorData}
            />
        </MainLayout>
    )
}