import React from 'react'
import NavBar from '../components/NavBar.jsx'
import Background from '../components/Background.jsx'

export default function MainLayout({ children, backgroundTheme = {} }) {
    return (
        <div className="relative min-h-screen">
            {/* Background with animations */}
            <Background theme={backgroundTheme} />
            
            {/* Content overlay */}
            <div className="relative z-10 min-h-screen flex flex-col items-center px-2">
                <div>
                    <NavBar />
                </div>

                <div className="w-full max-w-7xl flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}