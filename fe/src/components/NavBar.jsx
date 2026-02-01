import React from 'react';
import { LayoutGrid, FileEdit, Rss, Bell, User } from 'lucide-react';
import {useNavigate, useLocation} from 'react-router-dom';

export default function NavBar() {
    const navigate = useNavigate();
    const location = useLocation();

    const defineButton = [
        { icon: <LayoutGrid size={24} strokeWidth={1.5} />, alt: 'Dashboard', route: '/' },
        { icon: <FileEdit size={24} strokeWidth={1.5} />, alt: 'Action History', route: '/action-history' },
        { icon: <Rss size={24} strokeWidth={1.5} />, alt: 'Data Sensor', route: '/data-sensor' },
        { icon: <Bell size={24} strokeWidth={1.5} />, alt: 'Notifications', route: '/notifications' },
        { icon: <User size={24} strokeWidth={1.5} />, alt: 'Profile', route: '/profile' },
    ]

    const handleClick = (route) => {
        navigate(route);
        console.log(`Navigate to ${route}`);
    }

    return (
        <nav className="flex items-center gap-3 px-8 py-2 my-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
            {defineButton.map((button, index) => (
                <button
                    key={index}
                    className={`p-3 px-4 rounded-xl transition-colors ${
                            location.pathname === button.route ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    title={button.alt}
                    onClick={() => handleClick(button.route)}
                >
                    {button.icon}
                </button>
            ))}
        </nav>
    )
}