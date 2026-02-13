'use client';

import { useEffect, useState } from 'react';

interface KPICardProps {
  label: string;
  value: number | string;
  change?: number;
  icon?: string;
  alert?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  loading?: boolean;
  miniChart?: number[];
}

export default function KPICard({
  label,
  value,
  change,
  icon,
  alert = false,
  trend,
  subtitle,
  color = 'blue',
  loading = false,
  miniChart
}: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animated counter effect
  useEffect(() => {
    if (typeof value === 'number' && !loading) {
      setIsAnimating(true);
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
          setIsAnimating(false);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, loading]);

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl overflow-hidden group`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium opacity-90 mb-1">{label}</p>
            {subtitle && (
              <p className="text-xs opacity-75">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={`${iconBgClasses[color]} rounded-lg p-3 text-2xl transform transition-transform group-hover:scale-110`}>
              {icon}
            </div>
          )}
        </div>

        <div className="mb-2">
          <div className={`text-3xl font-bold ${isAnimating ? 'animate-pulse' : ''}`}>
            {typeof value === 'number' ? displayValue.toLocaleString() : value}
          </div>
        </div>

        {(change !== undefined || trend) && (
          <div className="flex items-center space-x-2">
            {change !== undefined && (
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                change > 0 ? 'bg-white/20' : change < 0 ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {Math.abs(change)}%
              </span>
            )}
            {trend && (
              <span className="text-xs opacity-75">
                {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'}
              </span>
            )}
          </div>
        )}

        {miniChart && miniChart.length > 0 && (
          <div className="mt-4 flex items-end space-x-1 h-12">
            {miniChart.map((val, idx) => {
              const maxVal = Math.max(...miniChart);
              const height = (val / maxVal) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-white/30 rounded-t transition-all duration-300 hover:bg-white/50"
                  style={{ height: `${height}%` }}
                  title={`${val}`}
                ></div>
              );
            })}
          </div>
        )}

        {alert && (
          <div className="absolute top-2 right-2">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
