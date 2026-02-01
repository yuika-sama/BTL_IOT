import React, { useState } from 'react';
// import * from 'lucide-react'

export default function ProfileButton({ link, icon, text }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button 
        className="flex items-center gap-2 px-5 py-1 rounded-xl transition-colors shadow-lg cursor-pointer"
        style={{
            backgroundColor: isHovered ? '#4d4d4d' : '#E2E8F0', 
            color: isHovered ? '#ffffff' : '#475569'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => window.open(link, "_blank")}
        >
            <span style={{ color: isHovered ? '#ffffff' : '#475569' }}>{icon}</span>
            <span className="font-semibold text-md" style={{ color: isHovered ? '#ffffff' : '#475569' }}>{text}</span>
        </button>
    );
}