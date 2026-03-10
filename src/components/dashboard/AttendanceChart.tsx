'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getChartColor } from '@/lib/chartColors';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AttendanceChartProps {
  data: {
    months: string[];
    attendancePercentages: number[];
  };
}

export default function AttendanceChart({ data }: AttendanceChartProps) {
  const chartData = {
    labels: data.months,
    datasets: [
      {
        label: 'Attendance %',
        data: data.attendancePercentages,
        borderColor: getChartColor(1),
        backgroundColor: getChartColor(1, 0.1),
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Attendance Trend (Last 6 Months)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" style={{ height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
