interface KPICardProps {
  label: string;
  value: number | string;
  change?: number;
  icon?: string;
  alert?: boolean;
}

export default function KPICard({ label, value, change, icon, alert }: KPICardProps) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${alert ? 'border-l-4 border-red-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-2 ${alert ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
            </p>
          )}
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
    </div>
  );
}