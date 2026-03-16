import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2, WifiOff } from 'lucide-react';

export default function ToggleCard({ 
    deviceName = "Thiết bị 1", 
    initialState = "off",
    isConnected = true,
    onToggle 
}) {
    const [state, setState] = useState(initialState); // "off", "waiting", "on", "disconnected"

    // Sync state khi initialState thay đổi (update từ socket)
    useEffect(() => {
        console.log('🎴 ToggleCard state sync:', { 
            deviceName, 
            initialState,
            currentState: state,
            isConnected
        });
        
        // Nếu disconnect, set state = disconnected
        if (!isConnected) {
            setState("disconnected");
        } else {
            setState(initialState);
        }
    }, [initialState, deviceName, isConnected]);

    const handleToggle = async () => {
        if (state === "waiting" || !isConnected) return; // Không cho toggle khi đang waiting hoặc disconnect

        setState("waiting");

        try {
            if (onToggle) {
                await onToggle();
            }
        } catch (error) {
            console.error('Toggle error:', error);
            // State sẽ được revert thông qua initialState từ parent
        }
    };

    const getCardStyle = () => {
        if (!isConnected || state === "disconnected") {
            return "bg-gray-100 border-2 border-gray-300 opacity-70";
        }
        if (state === "on") {
            return "bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400";
        }
        return "bg-white border-2 border-gray-200";
    };

    const getToggleStyle = () => {
        if (!isConnected || state === "disconnected") {
            return "bg-gray-400 cursor-not-allowed";
        }
        if (state === "on") {
            return "bg-orange-500";
        }
        return "bg-gray-300";
    };

    const getTextToggleStyle = () => {
        if (!isConnected || state === "disconnected") {
            return "text-gray-400 cursor-not-allowed";
        }
        if (state === "on") {
            return "text-orange-500";
        }
        return "text-gray-300";
    };

    const getToggleThumbStyle = () => {
        if (state === "on") {
            return "translate-x-6";
        }
        return "translate-x-0";
    };

    const getLightbulbColor = () => {
        if (!isConnected || state === "disconnected") {
            return "text-gray-400";
        }
        if (state === "on") {
            return "text-orange-500";
        }
        return "text-gray-400";
    };

    return (
        <div className={`rounded-2xl p-5 shadow-md transition-all duration-300 ${getCardStyle()}`}>
            <div className="flex items-center justify-between">
                {/* Left side - Device name and toggle */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <span className={`text-gray-700 font-medium ${getTextToggleStyle()}`}>{deviceName}</span>
                        {(!isConnected || state === "disconnected") && (
                            <WifiOff size={16} className="text-red-500" />
                        )}
                    </div>
                    
                    {/* Toggle switch or loading */}
                    <div className="flex items-center gap-3">
                        {state === "waiting" ? (
                            <Loader2 size={20} className="text-blue-500 animate-spin" />
                        ) : (
                            <button
                                onClick={handleToggle}
                                disabled={!isConnected || state === "disconnected"}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${getToggleStyle()}`}
                            >
                                <div 
                                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${getToggleThumbStyle()}`}
                                />
                            </button>
                        )}
                        {(!isConnected || state === "disconnected") && (
                            <span className="text-xs text-red-500">Ngắt kết nối</span>
                        )}
                    </div>
                </div>

                {/* Right side - Lightbulb icon */}
                <Lightbulb 
                    size={56} 
                    className={`transition-colors duration-300 ${getLightbulbColor()}`}
                    fill={state === "on" && isConnected ? "currentColor" : "none"}
                />
            </div>
        </div>
    );
}