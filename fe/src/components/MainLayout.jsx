import React from 'react'
import NavBar from '../components/NavBar.jsx'
import bgImage from '../assets/BG.png'

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat" 
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="min-h-screen flex flex-col items-center px-4 pb-8">
                <div >
                    <NavBar />
                </div>

                <div className="w-full max-w-7xl flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}