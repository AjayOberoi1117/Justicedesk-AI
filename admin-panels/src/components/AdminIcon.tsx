import React from 'react'
import {
  Newspaper,
  Scale,
  Users,
  Package,
} from 'lucide-react'

interface AdminIconProps {
  product: 'current' | 'justice-desk' | 'vakeel-sahib' | 'medideals'
  size?: number
  className?: string
}

const PRODUCT_ICONS = {
  current: {
    icon: Newspaper,
    name: 'CURRENT',
    subtitle: 'News Platform',
    color: '#EA8B15',
    bgColor: '#FEF3E2',
  },
  'justice-desk': {
    icon: Scale,
    name: 'Justice Desk',
    subtitle: 'Legal Services',
    color: '#4F3AFF',
    bgColor: '#EFF0F8',
  },
  'vakeel-sahib': {
    icon: Users,
    name: 'Vakeel Sahib',
    subtitle: 'Advocate Network',
    color: '#7C3AED',
    bgColor: '#F0E5FF',
  },
  medideals: {
    icon: Package,
    name: 'MediDeals',
    subtitle: 'B2B Pharmacy',
    color: '#14A04E',
    bgColor: '#E3F2E0',
  },
}

export default function AdminIcon({
  product,
  size = 24,
  className = '',
}: AdminIconProps) {
  const config = PRODUCT_ICONS[product]
  const Icon = config.icon

  return (
    <Icon
      size={size}
      color={config.color}
      className={className}
      strokeWidth={1.5}
    />
  )
}

export function AdminIconWithBg({
  product,
  size = 60,
}: {
  product: keyof typeof PRODUCT_ICONS
  size?: number
}) {
  const config = PRODUCT_ICONS[product]
  const Icon = config.icon
  const wrapperSize = size + 20

  return (
    <div
      style={{
        width: wrapperSize,
        height: wrapperSize,
        backgroundColor: config.bgColor,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={size} color={config.color} strokeWidth={1.5} />
    </div>
  )
}

export function getProductConfig(product: keyof typeof PRODUCT_ICONS) {
  return PRODUCT_ICONS[product]
}

export { PRODUCT_ICONS }
