'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'doughnut' | 'radar' | 'pie';
  data: any;
  options?: any;
  height?: number;
  loading?: boolean;
}

export default function ChartCard({
  title,
  subtitle,
  type,
  data,
  options,
  height = 300,
  loading = false
}: ChartCardProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        cornerRadius: 8
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={mergedOptions} />;
      case 'bar':
        return <Bar data={data} options={mergedOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={mergedOptions} />;
      case 'radar':
        return <Radar data={data} options={mergedOptions} />;
      case 'pie':
        return <Pie data={data} options={mergedOptions} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        {subtitle && <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>}
        <div className="bg-gray-100 rounded-lg animate-pulse" style={{ height: `${height}px` }}></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  );
}

// Multi-line chart component
export function MultiLineChart({ title, subtitle, data, height = 300, loading = false }: any) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return <ChartCard title={title} subtitle={subtitle} type="line" data={data} options={options} height={height} loading={loading} />;
}

// Stacked bar chart component
export function StackedBarChart({ title, subtitle, data, height = 300, loading = false }: any) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  return <ChartCard title={title} subtitle={subtitle} type="bar" data={data} options={options} height={height} loading={loading} />;
}

// Gradient line chart
export function GradientLineChart({ title, subtitle, data, height = 300, loading = false }: any) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      }
    }
  };

  return <ChartCard title={title} subtitle={subtitle} type="line" data={data} options={options} height={height} loading={loading} />;
}
