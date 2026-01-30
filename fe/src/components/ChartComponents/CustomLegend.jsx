const CustomLegend = ({ color1, color2, label1, label2 }) => {
    return (
        <div className="flex items-center gap-6 justify-end px-6 pb-2">
            <div className="flex items-center gap-2">
                <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color1 }}
                />
                <span className="text-sm text-gray-600">{label1}</span>
            </div>
            <div className="flex items-center gap-2">
                <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color2 }}
                />
                <span className="text-sm text-gray-600">{label2}</span>
            </div>
        </div>
    );
};

export default CustomLegend;