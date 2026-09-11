import { Outlet, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import AdminIcon, { getProductConfig } from './AdminIcon'

const ProductInfo: Record<string, { name: string; color: string; bgColor: string; description: string; hexColor: string }> = {
  current: { name: 'CURRENT', color: 'bg-orange-600', bgColor: '#FEF3E2', hexColor: '#EA8B15', description: 'News Platform' },
  'justice-desk': { name: 'Justice Desk', color: 'bg-indigo-600', bgColor: '#EFF0F8', hexColor: '#4F3AFF', description: 'Legal Services' },
  'vakeel-sahib': { name: 'Vakeel Sahib', color: 'bg-violet-600', bgColor: '#F0E5FF', hexColor: '#7C3AED', description: 'Advocate Network' },
  medideals: { name: 'MediDeals', color: 'bg-green-600', bgColor: '#E3F2E0', hexColor: '#14A04E', description: 'Pharma Marketplace' },
}

export default function Layout() {
  const navigate = useNavigate()
  const productMode = useAppStore(s => s.productMode)
  const authState = useAppStore(s => s.authState[s.productMode!])
  const logout = useAppStore(s => s.logout)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!productMode) return null

  const product = ProductInfo[productMode]
  const isAuthenticated = authState?.isAuthenticated

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!isAuthenticated) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className={`${product.color} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AdminIcon product={productMode as 'current' | 'justice-desk' | 'vakeel-sahib' | 'medideals'} size={28} />
              <div>
                <div className="text-2xl font-bold">{product.name}</div>
                <div className="text-sm opacity-90">{product.description}</div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-sm">
                {authState?.user?.name || 'User'}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <div className="text-sm mb-3">{authState?.user?.name || 'User'}</div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all w-full"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>Admin Panel v1.0 | {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
