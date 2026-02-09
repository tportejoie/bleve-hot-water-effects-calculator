
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartData } from '../types';

interface OverpressureChartProps {
  data: ChartData[];
}

const OverpressureChart: React.FC<OverpressureChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 5, right: 30, left: 20, bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="distance" 
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Distance (m)', position: 'bottom', fill: '#9ca3af' }}
            tick={{ fill: '#d1d5db', fontSize: 12 }}
            stroke="#4b5563"
          />
          <YAxis 
            label={{ value: 'Overpressure (mbar)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            tick={{ fill: '#d1d5db', fontSize: 12 }}
            stroke="#4b5563"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} 
            labelStyle={{ color: '#e5e7eb' }}
            formatter={(value: number, name: string) => [`${value.toFixed(1)} ${name === 'overpressure' ? 'mbar' : ''}`,'']}
            labelFormatter={(label: number) => `Distance: ${label.toFixed(1)} m`}
          />
          <Legend wrapperStyle={{ color: '#e5e7eb' }} />
          <Line type="monotone" dataKey="overpressure" stroke="#c9a86a" strokeWidth={2} dot={false} name="Overpressure" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverpressureChart;
