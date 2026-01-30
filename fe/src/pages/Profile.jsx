import React from 'react';
import MainLayout from '../components/MainLayout';
import ProfileButton from '../components/ProfileButton';
import { Github, Figma, Globe } from 'lucide-react';
import profileAvatar from '../assets/profile_avatar.jpg';

export default function Profile() {
    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 items-start bg-white rounded-3xl shadow-xl p-8">
                {/* Left side - Profile Card */}
                <div className="flex flex-col items-center">
                    <div className="w-80 h-80 rounded-3xl overflow-hidden mb-8 shadow-md">
                        <img 
                            src={profileAvatar} 
                            alt="Profile Avatar" 
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
                        Nguyễn Đức Anh
                    </h1>

                    <p className="text-gray-400 text-lg mb-3">
                        B22DCPT009
                    </p>

                    <p className="text-gray-600 text-base mb-8">
                        nguyenanhduc2938@gmail.com
                    </p>

                    <div className="flex gap-3 flex-wrap justify-center w-full px-4">
                        <ProfileButton 
                            icon={<Github size={16} />}
                            text="Github" 
                            link="https://github.com/yuika-sama" 
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
                <div className="rounded-3xl overflow-hidden">
                    <div className="bg-slate-700 text-white px-6 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium">auth.docx</span>
                    </div>
                    <div className="h-[525px] overflow-hidden">
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