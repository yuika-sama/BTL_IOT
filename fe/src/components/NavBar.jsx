import React from 'react';
import { LayoutGrid, FileEdit, Rss, User, BarChart3 } from 'lucide-react';
import {useNavigate, useLocation} from 'react-router-dom';

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const defineButton = [
        { icon: <LayoutGrid size={24} strokeWidth={1.5} />, alt: 'Dashboard', route: '/' },
        { icon: <FileEdit size={24} strokeWidth={1.5} />, alt: 'Action History', route: '/action-history' },
        { icon: <BarChart3 size={24} strokeWidth={1.5} />, alt: 'Device Stats', route: '/device-action-stats' },
        { icon: <Rss size={24} strokeWidth={1.5} />, alt: 'Data Sensor', route: '/data-sensor' },
        { icon: <User size={24} strokeWidth={1.5} />, alt: 'Profile', route: '/profile' },
    ]

    const handleClick = (route) => {
        navigate(route);
        console.log(`Navigate to ${route}`);
    }

    return (
        <nav className="flex items-center gap-2 px-4 py-2 my-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-x-auto max-w-full">
            {defineButton.map((button, index) => (
                <button
                    key={index}
                    className={`flex items-center gap-2 p-3 px-4 rounded-xl transition-colors whitespace-nowrap ${
                            location.pathname === button.route ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    title={button.alt}
                    onClick={() => handleClick(button.route)}
                >
                    {button.icon}
                    <span className="text-sm font-medium">{button.alt}</span>
                </button>
            ))}
        </nav>
    )
}