import React from 'react';
// import * from 'lucide-react'

export default function ProfileButton({ link, icon, text }) {
    return (
        <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors shadow-sm"
            onClick={() => window.open(link, "_blank")}
        >
            <span className="text-gray-700">{icon}</span>
            <span className="text-gray-700 font-medium text-sm">{text}</span>
        </button>
    );
}