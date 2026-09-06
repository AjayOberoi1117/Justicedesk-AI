import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'

interface StatusCardProps {
  title: string
  status: 'healthy' | 'degraded' | 'unavailable' | 'unknown'
  value?: string | number
  lastChecked?: Date
  details?: string
}

export default function StatusCard({ title, status, value, lastChecked, details }: StatusCardProps) {
  const statusConfig = {
    healthy: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: <CheckCircle className="text-green-600" size={20} />,
      label: 'Healthy',
    },
    degraded: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: <AlertCircle className="text-yellow-600" size={20} />,
      label: 'Degraded',
    },
    unavailable: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: <WifiOff className="text-red-600" size={20} />,
      label: 'Unavailable',
    },
    unknown: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: <Wifi className="text-gray-600" size={20} />,
      label: 'Unknown',
    },
  }

  const config = statusConfig[status]

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-6`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {config.icon}
      </div>

      <div className={`text-3xl font-bold ${config.text} mb-2`}>
        {value !== undefined ? value : config.label}
      </div>

      {details && (
        <p className="text-sm text-gray-600 mb-2">{details}</p>
      )}

      {lastChecked && (
        <p className="text-xs text-gray-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
