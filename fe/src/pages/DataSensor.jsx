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
        { key: 'id',header: 'ID', accessor: 'id' },
        { key: 'deviceName', header: 'Tên thiết bị', accessor: 'deviceName' },
        { key: 'temperature', header: 'Nhiệt độ', accessor: 'temperature' },
        { key: 'humidity', header: 'Độ ẩm', accessor: 'humidity' },
        { key: 'light', header: 'Ánh sáng', accessor: 'light' },
        { key: 'dust', header: 'Bụi mịn', accessor: 'dust' },
        { key: 'timestamp', header: 'Thời gian', accessor: 'timestamp' },
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