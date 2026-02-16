import React from 'react';
import MainLayout from '../components/MainLayout';
import ProfileButton from '../components/ProfileButton';
import { Github, Figma, Globe } from 'lucide-react';
import profileAvatar from '../assets/profile_avatar.jpg';

export default function Profile() {
    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 items-start bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border-2 border-gray-100 p-10">
                {/* Left side - Profile Card */}
                <div className="flex flex-col items-center">
                    <div className="w-80 h-80 rounded-3xl overflow-hidden mb-8 shadow-2xl border-4 border-white ring-4 ring-gray-100 transition-transform duration-300 hover:scale-105">
                        <img 
                            src={profileAvatar} 
                            alt="Profile Avatar" 
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h1 className="text-4xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4 text-center">
                        Nguyễn Đức Anh
                    </h1>

                    <p className="text-gray-700 font-bold text-lg">
                        B22DCPT009
                    </p>

                    <p className="text-gray-600 text-base mb-8 font-medium">
                        nguyenanhduc2938@gmail.com
                    </p>

                    <div className="flex gap-3 flex-wrap justify-center w-full px-4">
                        <ProfileButton 
                            icon={<Github size={16} />}
                            text="Github" 
                            link="https://github.com/yuika-sama/BTL_IOT" 
                        />
                        <ProfileButton 
                            icon={<Figma size={16} />}
                            text="Figma" 
                            link="https://www.figma.com/design/ZQbq8oJa17A3mG3duZZxpE/Web-IOT?node-id=14-2&t=0hkIwcid4rnGg4LS-1" 
                        />
                        <ProfileButton 
                            icon={<Globe size={16} />}
                            text="API Docs" 
                            link="https://api-docs.com" 
                        />
                    </div>
                </div>

                {/* Right side - Document Viewer */}
                <div className="rounded-3xl overflow-hidden shadow-xl border-2 border-gray-200">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-4 flex items-center justify-between shadow-md">
                        <span className="text-sm font-bold">auth.docx</span>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        </div>
                    </div>
                    <div className="h-[525px] overflow-hidden bg-gray-50">
                        <iframe 
                            src="https://drive.google.com/file/d/1rFPcBTtTfo_RcIVNclF9EmalFKFXxl4o/preview" 
                            className="w-full h-full border-0"
                            title="API Documentation"
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}