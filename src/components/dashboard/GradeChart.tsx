'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { getChartColor } from '@/lib/chartColors';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GradeChartProps {
  data: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

export default function GradeChart({ data }: GradeChartProps) {
  const chartData = {
    labels: ['A', 'B', 'C', 'D', 'F'],
    datasets: [
      {
        data: [data.A, data.B, data.C, data.D, data.F],
        backgroundColor: [
          getChartColor(2, 0.9),
          getChartColor(1, 0.9),
          getChartColor(5, 0.9),
          getChartColor(5, 0.6),
          getChartColor(4, 0.9),
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Grade Distribution',
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" style={{ height: '400px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
