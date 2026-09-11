import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminIcon, { PRODUCT_ICONS } from './AdminIcon'

export default function ProductSwitcher() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentProduct = (searchParams.get('product') || 'current') as keyof typeof PRODUCT_ICONS

  const products = Object.entries(PRODUCT_ICONS) as [
    keyof typeof PRODUCT_ICONS,
    (typeof PRODUCT_ICONS)[keyof typeof PRODUCT_ICONS]
  ][]

  const handleSwitch = (product: string) => {
    navigate(`/?product=${product}`)
  }

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
        Admin Panels
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '8px',
        }}
      >
        {products.map(([key, config]) => (
          <button
            key={key}
            onClick={() => handleSwitch(key)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: currentProduct === key ? `2px solid ${config.color}` : '1px solid #e5e7eb',
              backgroundColor: currentProduct === key ? config.bgColor : '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <AdminIcon product={key} size={20} />
            <div style={{ fontSize: '11px', fontWeight: 500, color: config.color }}>
              {config.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
