import React, { memo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MetricsChartProps {
    data: number[];
    isUp: boolean;
}

export const MetricsChart: React.FC<MetricsChartProps> = memo(({ data, isUp }) => {
    const chartData = data.map((val, i) => ({ i, val }));

    return (
        <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <Line
                        type="monotone"
                        dataKey="val"
                        stroke={isUp ? '#10b981' : '#f43f5e'}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});
