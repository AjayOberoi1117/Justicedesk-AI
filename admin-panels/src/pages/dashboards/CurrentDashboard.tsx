import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import StatusCard from '../../components/StatusCard'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { RefreshCw } from 'lucide-react'
import { currentService, Provider } from '../../services/current-service'

interface ProviderMetrics extends Provider {
  lastUpdate: Date
}

export default function CurrentDashboard() {
  const backendStatus = useAppStore(s => s.backendStatus[s.productMode!])
  const [providers, setProviders] = useState<ProviderMetrics[]>([])
  const [metrics, setMetrics] = useState({
    totalStories: 0,
    freshStories24h: 0,
    lastFetch: new Date(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch real data from CURRENT backend
      const [providerData, metricsData] = await Promise.all([
        currentService.listProviders(),
        currentService.getMetrics(),
      ])

      // Transform provider data to include Date object
      const transformedProviders: ProviderMetrics[] = providerData.map(p => ({
        ...p,
        lastUpdate: new Date(p.lastUpdate),
      }))

      setProviders(transformedProviders)
      setMetrics({
        totalStories: metricsData.totalStories,
        freshStories24h: metricsData.freshStories24h,
        lastFetch: new Date(metricsData.lastFetch),
      })
    } catch (err) {
      // Fail-closed: show error, no mock data fallback
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from backend'
      setError(errorMessage)
      setProviders([])
      setMetrics({
        totalStories: 0,
        freshStories24h: 0,
        lastFetch: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CURRENT Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">News ingestion and content management</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Backend Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusCard
            title="Backend Connection"
            status={backendStatus.connected ? 'healthy' : 'unavailable'}
            value={backendStatus.connected ? 'Connected' : 'Disconnected'}
            lastChecked={backendStatus.lastChecked}
            details={backendStatus.error || 'Checking production backend...'}
          />
          <StatusCard
            title="Ingestion Pipeline"
            status={backendStatus.healthy ? 'healthy' : 'unavailable'}
            value={backendStatus.healthy ? 'Active' : 'Inactive'}
            lastChecked={backendStatus.lastChecked}
          />
        </div>

        {/* Story Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusCard
            title="Total Stories in Feed"
            status={metrics.totalStories > 0 ? 'healthy' : 'unavailable'}
            value={metrics.totalStories}
            details="All unique stories across all providers"
          />
          <StatusCard
            title="Fresh Stories (24h)"
            status={metrics.freshStories24h > 0 ? 'healthy' : 'unavailable'}
            value={metrics.freshStories24h}
            details="Stories published in last 24 hours"
          />
        </div>

        {/* Providers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">News Source Providers</h2>
          <div className="space-y-4">
            {providers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No provider data available</p>
            ) : (
              providers.map((provider, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600">
                      {provider.status === 'unavailable' ? (
                        'No data available'
                      ) : (
                        <>
                          {provider.storiesCount} stories • Last update: {provider.lastUpdate.toLocaleTimeString()}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      provider.status === 'healthy' ? 'bg-green-600' :
                      provider.status === 'degraded' ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}></span>
                    <span className="text-sm font-medium text-gray-700 capitalize">{provider.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
          <p>Last refreshed: {metrics.lastFetch.toLocaleTimeString()}</p>
          <p className="text-xs text-gray-500 mt-1">Connect to backend to enable real data</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
