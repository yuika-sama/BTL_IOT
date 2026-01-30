const CustomTooltip = ({ active, payload, color1, color2, label1, label2, unit1, unit2 }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">{payload[0].payload.timestamp}</p>
                <p className="text-sm font-medium" style={{ color: color1 }}>
                    {label1}: {payload[0].value} {unit1}
                </p>
                {payload[1] && (
                    <p className="text-sm font-medium" style={{ color: color2 }}>
                        {label2}: {payload[1].value} {unit2}
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default CustomTooltip;