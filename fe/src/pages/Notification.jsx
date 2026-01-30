import React, {useMemo} from 'react';
import NavBar from '../components/NavBar.jsx';
import InformationLayout from '../components/InformationLayout.jsx';
import { sampleNotificationData } from '../utils/sampleData.js';

export default function Notifications(){
    const filterOptions = [
        {type: 'all', displayText: 'Tất cả'},
        {type: 'name', displayText: 'Tên thiết bị'},
        {type: 'action', displayText: 'Hành động'},
        {type: 'time', displayText: 'Thời gian'},
    ]


    const mergeColumns = useMemo(() => {
        return sampleNotificationData.map(item => ({
            ...item,
            description: `${item.description.title} - ${item.description.description}`
        }))
    }, [])

    const columns = [
        { key: 'critical',header: 'Độ nghiêm trọng', accessor: 'critical' },
        { key: 'deviceName', header: 'Tên thiết bị', accessor: 'deviceName' },
        { key: 'timestamp', header: 'Thời gian', accessor: 'timestamp' },
        { key: 'description', header: 'Thông báo', accessor: 'description' },
    ]
    
    return(
        <div className="min-h-screen bg-gray-100">
            <div className='flex justify-center'>
                <NavBar />
            </div>
            <div className="max-w-6xl mx-auto p-6">
                <InformationLayout filterOptions={filterOptions} columns={columns} data={mergeColumns} />
            </div>
        </div>
    )
}