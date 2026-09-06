import { AlertCircle, CheckCircle, InfoIcon, AlertTriangle, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  onClose?: () => void
  autoClose?: boolean
  autoCloseDuration?: number
}

export default function Alert({
  type,
  title,
  message,
  onClose,
  autoClose = false,
  autoCloseDuration = 5000,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoCloseDuration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, autoCloseDuration, onClose])

  if (!isVisible) return null

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <CheckCircle className="text-green-600" size={20} />,
      text: 'text-green-800',
      title: 'text-green-900',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertCircle className="text-red-600" size={20} />,
      text: 'text-red-800',
      title: 'text-red-900',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <AlertTriangle className="text-yellow-600" size={20} />,
      text: 'text-yellow-800',
      title: 'text-yellow-900',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <InfoIcon className="text-blue-600" size={20} />,
      text: 'text-blue-800',
      title: 'text-blue-900',
    },
  }[type]

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-4 flex items-start gap-4`}>
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="flex-1">
        <h3 className={`font-semibold ${config.title}`}>{title}</h3>
        {message && <p className={`text-sm ${config.text} mt-1`}>{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false)
            onClose()
          }}
          className={`flex-shrink-0 ${config.text} hover:opacity-70`}
        >
          <X size={20} />
        </button>
      )}
    </div>
  )
}
