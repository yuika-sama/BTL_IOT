import React, { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';

export default function ToggleCard({ 
    deviceName = "Thiết bị 1", 
    initialState = "off",
    onToggle 
}) {
    const [state, setState] = useState(initialState); // "off", "waiting", "on"

    const handleToggle = async () => {
        if (state === "waiting") return; // Không cho toggle khi đang waiting

        const newState = state === "on" ? "off" : "on";
        setState("waiting");

        try {
            if (onToggle) {
                await onToggle(newState);
            }
            // Simulate API call delay
            setTimeout(() => {
                setState(newState);
            }, 1500);
        } catch (error) {
            setState(state); // Revert về state cũ nếu có lỗi
            throw error;
        }
    };

    const getCardStyle = () => {
        if (state === "on") {
            return "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400";
        }
        return "bg-white border-2 border-gray-200";
    };

    const getToggleStyle = () => {
        if (state === "on") {
            return "bg-blue-500";
        }
        return "bg-gray-300";
    };

    const getToggleThumbStyle = () => {
        if (state === "on") {
            return "translate-x-6";
        }
        return "translate-x-0";
    };

    const getLightbulbColor = () => {
        if (state === "on") {
            return "text-yellow-500";
        }
        return "text-gray-400";
    };

    return (
        <div className={`rounded-2xl p-5 shadow-md transition-all duration-300 ${getCardStyle()}`}>
            <div className="flex items-center justify-between">
                {/* Left side - Device name and toggle */}
                <div className="flex flex-col gap-3">
                    <span className="text-gray-700 font-medium">{deviceName}</span>
                    
                    {/* Toggle switch or loading */}
                    <div className="flex items-center gap-3">
                        {state === "waiting" ? (
                            <Loader2 size={20} className="text-gray-500 animate-spin" />
                        ) : (
                            <button
                                onClick={handleToggle}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${getToggleStyle()}`}
                            >
                                <div 
                                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${getToggleThumbStyle()}`}
                                />
                            </button>
                        )}
                    </div>
                </div>

                {/* Right side - Lightbulb icon */}
                <Lightbulb 
                    size={48} 
                    className={`transition-colors duration-300 ${getLightbulbColor()}`}
                    fill={state === "on" ? "currentColor" : "none"}
                />
            </div>
        </div>
    );
}