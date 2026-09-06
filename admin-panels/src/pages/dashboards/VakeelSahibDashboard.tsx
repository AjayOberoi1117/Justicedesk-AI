import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import StatusCard from '../../components/StatusCard'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { RefreshCw } from 'lucide-react'

interface VSAdvocate {
  id: string
  name: string
  email: string
  barEnrollment: 'pending' | 'verified' | 'rejected'
  pan: 'pending' | 'verified' | 'rejected'
  aadhaar: 'pending' | 'verified' | 'rejected' | 'not_required'
  createdAt: Date
}

export default function VakeelSahibDashboard() {
  const backendStatus = useAppStore(s => s.backendStatus[s.productMode!])
  const [advocates, setAdvocates] = useState<VSAdvocate[]>([])
  const [metrics, setMetrics] = useState({
    totalAdvocates: 0,
    kycComplete: 0,
    pendingKYC: 0,
    rejectedKYC: 0,
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
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (!backendStatus.connected) {
        setAdvocates([])
        setMetrics({
          totalAdvocates: 0,
          kycComplete: 0,
          pendingKYC: 0,
          rejectedKYC: 0,
        })
        setError('Backend unavailable - showing no data')
      } else {
        const mockAdvocates: VSAdvocate[] = [
          { id: '1', name: 'Dr. Ashok Kumar', email: 'ashok@vakeel.com', barEnrollment: 'verified', pan: 'verified', aadhaar: 'verified', createdAt: new Date(Date.now() - 86400000) },
          { id: '2', name: 'Ms. Anita Sharma', email: 'anita@vakeel.com', barEnrollment: 'verified', pan: 'verified', aadhaar: 'verified', createdAt: new Date(Date.now() - 172800000) },
          { id: '3', name: 'Mr. Rohan Singh', email: 'rohan@vakeel.com', barEnrollment: 'pending', pan: 'verified', aadhaar: 'not_required', createdAt: new Date(Date.now() - 3600000) },
          { id: '4', name: 'Ms. Divya Gupta', email: 'divya@vakeel.com', barEnrollment: 'verified', pan: 'pending', aadhaar: 'not_required', createdAt: new Date(Date.now() - 7200000) },
        ]

        setAdvocates(mockAdvocates)
        const complete = mockAdvocates.filter(a => a.barEnrollment === 'verified' && a.pan === 'verified').length
        const pending = mockAdvocates.filter(a => a.barEnrollment === 'pending' || a.pan === 'pending').length
        const rejected = mockAdvocates.filter(a => a.barEnrollment === 'rejected' || a.pan === 'rejected').length

        setMetrics({
          totalAdvocates: mockAdvocates.length,
          kycComplete: complete,
          pendingKYC: pending,
          rejectedKYC: rejected,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const getKYCCompleteness = (advocate: VSAdvocate) => {
    let complete = 0
    let required = 2 // Bar Enrollment and PAN are mandatory

    if (advocate.barEnrollment === 'verified') complete++
    if (advocate.pan === 'verified') complete++

    return `${complete}/${required}`
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'not_required': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vakeel Sahib Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Advocate network management and KYC verification</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
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

        {/* KYC Policy Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">KYC Requirements</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Bar Council Enrollment: <strong>Mandatory</strong></li>
            <li>✓ PAN: <strong>Mandatory</strong></li>
            <li>✓ Aadhaar: <strong>Optional</strong></li>
          </ul>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusCard
            title="Total Advocates"
            status={metrics.totalAdvocates > 0 ? 'healthy' : 'unavailable'}
            value={metrics.totalAdvocates}
            details="Advocates in network"
          />
          <StatusCard
            title="KYC Complete"
            status={metrics.kycComplete > 0 ? 'healthy' : 'unavailable'}
            value={metrics.kycComplete}
            details="All mandatory docs verified"
          />
          <StatusCard
            title="Pending KYC"
            status={metrics.pendingKYC > 0 ? 'degraded' : 'healthy'}
            value={metrics.pendingKYC}
            details="Awaiting document review"
          />
          <StatusCard
            title="KYC Rejected"
            status={metrics.rejectedKYC > 0 ? 'degraded' : 'healthy'}
            value={metrics.rejectedKYC}
            details="Failed verification"
          />
        </div>

        {/* Advocates Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Advocates</h2>

          {advocates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No advocates found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Bar Enrollment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">PAN</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Aadhaar</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">KYC Progress</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {advocates.map((advocate) => (
                    <tr key={advocate.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{advocate.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(advocate.barEnrollment)}`}>
                          {advocate.barEnrollment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(advocate.pan)}`}>
                          {advocate.pan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(advocate.aadhaar)}`}>
                          {advocate.aadhaar}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                        {getKYCCompleteness(advocate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{advocate.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
