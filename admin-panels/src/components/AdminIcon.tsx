import React from 'react'

interface AdminIconProps {
  product: 'current' | 'justice-desk' | 'vakeel-sahib' | 'medideals'
  size?: number
  className?: string
}

const PRODUCT_ICONS = {
  current: {
    iconPath: '/icons/current-icon.png',
    name: 'CURRENT',
    subtitle: 'News Platform',
    color: '#EA8B15',
    bgColor: '#FEF3E2',
  },
  'justice-desk': {
    iconPath: '/icons/justice-desk-icon.png',
    name: 'Justice Desk',
    subtitle: 'Legal Services',
    color: '#4F3AFF',
    bgColor: '#EFF0F8',
  },
  'vakeel-sahib': {
    iconPath: '/icons/vakeel-sahib-icon.png',
    name: 'Vakeel Sahib',
    subtitle: 'Advocate Network',
    color: '#7C3AED',
    bgColor: '#F0E5FF',
  },
  medideals: {
    iconPath: '/icons/medideals-icon.png',
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

  return (
    <img
      src={config.iconPath}
      alt={config.name}
      width={size}
      height={size}
      className={`rounded-md object-cover ${className}`}
      style={{ aspectRatio: '1 / 1' }}
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
        overflow: 'hidden',
      }}
    >
      <img
        src={config.iconPath}
        alt={config.name}
        width={size}
        height={size}
        style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
      />
    </div>
  )
}

export function getProductConfig(product: keyof typeof PRODUCT_ICONS) {
  return PRODUCT_ICONS[product]
}

export { PRODUCT_ICONS }
