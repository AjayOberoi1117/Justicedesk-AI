import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './store'
import { ProductMode } from './types'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import CurrentDashboard from './pages/dashboards/CurrentDashboard'
import JusticeDeskDashboard from './pages/dashboards/JusticeDeskDashboard'
import VakeelSahibDashboard from './pages/dashboards/VakeelSahibDashboard'
import MediDealsDashboard from './pages/dashboards/MediDealsDashboard'
import NotFound from './pages/NotFound'

function App() {
  const setProductMode = useAppStore(s => s.setProductMode)
  const productMode = useAppStore(s => s.productMode)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    // Detect product mode from URL parameter
    const params = new URLSearchParams(window.location.search)
    const product = params.get('product')

    const validProducts: ProductMode[] = ['current', 'justice-desk', 'vakeel-sahib', 'medideals']
    const detectedProduct = (product as ProductMode) || 'current'

    if (!validProducts.includes(detectedProduct)) {
      setInitError(`Invalid product: ${product}`)
      setIsInitializing(false)
      return
    }

    setProductMode(detectedProduct)
    setIsInitializing(false)
  }, [setProductMode])

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700 mb-4">{initError}</p>
          <p className="text-sm text-gray-600">Valid products: current, justice-desk, vakeel-sahib, medideals</p>
        </div>
      </div>
    )
  }

  if (!productMode) {
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardRouter productMode={productMode} />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function DashboardRouter({ productMode }: { productMode: ProductMode }) {
  switch (productMode) {
    case 'current':
      return <CurrentDashboard />
    case 'justice-desk':
      return <JusticeDeskDashboard />
    case 'vakeel-sahib':
      return <VakeelSahibDashboard />
    case 'medideals':
      return <MediDealsDashboard />
    default:
      return <Navigate to="/login" />
  }
}

export default App
