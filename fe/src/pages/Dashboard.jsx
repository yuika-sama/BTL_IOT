import React from 'react';
import MainLayout from '../components/MainLayout.jsx';
import InforCard from '../components/InforCard.jsx';
import ToggleCard from '../components/ToggleCard.jsx';
import Chart from '../components/Chart.jsx';
import { sampleTemperatureData, sampleHumidityData, sampleLightData, sampleDustData } from '../utils/sampleData.js';

export default function Dashboard() {
    const handleToggleDevice = async (deviceName, newState) => {
        console.log(`${deviceName} turned ${newState}`);
        // Call API here
    };

    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - InforCard và ToggleCards */}
                <div className="space-y-6
                ">
                    {/* InforCard */}
                    <InforCard 
                        temperature={25.2} 
                        humidity={50} 
                        light={418} 
                        dust={13} 
                    />

                    {/* Grid 2x2 ToggleCards */}
                    <div className="grid grid-cols-2 gap-4">
                        <ToggleCard 
                            deviceName="Thiết bị 1" 
                            initialState="off"
                            onToggle={(state) => handleToggleDevice("Thiết bị 1", state)}
                        />
                        <ToggleCard 
                            deviceName="Thiết bị 1" 
                            initialState="off"
                            onToggle={(state) => handleToggleDevice("Thiết bị 2", state)}
                        />
                        <ToggleCard 
                            deviceName="Thiết bị 1" 
                            initialState="on"
                            onToggle={(state) => handleToggleDevice("Thiết bị 3", state)}
                        />
                        <ToggleCard 
                            deviceName="Thiết bị 1" 
                            initialState="waiting"
                            onToggle={(state) => handleToggleDevice("Thiết bị 4", state)}
                        />
                    </div>
                </div>

                {/* Right Column - Charts */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Chart 1 - Ánh sáng & Bụi mịn */}
                    <Chart 
                        data1={sampleLightData} 
                        data2={sampleDustData} 
                        color1="#fbbf24" 
                        color2="#9ca3af" 
                        label1="Ánh sáng" 
                        label2="Bụi mịn" 
                        unit1="lux" 
                        unit2="PM2.5" 
                        min1={0} 
                        max1={700} 
                        min2={0} 
                        max2={100} 
                        title="Ánh sáng & bụi mịn" 
                        subtitle="Light Intensity & Dust trends" 
                    />

                    {/* Chart 2 - Nhiệt độ & Độ ẩm */}
                    <Chart 
                        data1={sampleTemperatureData} 
                        data2={sampleHumidityData}
                        color1="#22c55e" 
                        color2="gray" 
                        label1="Nhiệt độ"
                        label2="Độ ẩm"
                        unit1="°C"
                        unit2="%"
                        min1={20}
                        max1={30}
                        min2={40}
                        max2={90}
                        title="Nhiệt độ & độ ẩm"
                        subtitle="Temperature & Humidity trends"
                    />
                </div>
            </div>
        </MainLayout>
    );
}