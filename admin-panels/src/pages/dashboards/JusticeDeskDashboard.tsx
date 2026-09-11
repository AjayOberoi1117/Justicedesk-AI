import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import StatusCard from '../../components/StatusCard'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { RefreshCw, Filter } from 'lucide-react'

interface JDUser {
  id: string
  name: string
  email: string
  kycStatus: 'pending' | 'verified' | 'rejected' | 'submitted'
  documentsVerified: number
  createdAt: Date
}

export default function JusticeDeskDashboard() {
  const backendStatus = useAppStore(s => s.backendStatus[s.productMode!])
  const [users, setUsers] = useState<JDUser[]>([])
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKYC: 0,
    rejectedKYC: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (!backendStatus.connected) {
        setUsers([])
        setMetrics({
          totalUsers: 0,
          verifiedUsers: 0,
          pendingKYC: 0,
          rejectedKYC: 0,
        })
        setError('Backend unavailable - showing no data')
      } else {
        const mockUsers: JDUser[] = [
          { id: '1', name: 'Rajesh Kumar', email: 'rajesh@example.com', kycStatus: 'verified', documentsVerified: 3, createdAt: new Date(Date.now() - 86400000) },
          { id: '2', name: 'Priya Singh', email: 'priya@example.com', kycStatus: 'verified', documentsVerified: 3, createdAt: new Date(Date.now() - 172800000) },
          { id: '3', name: 'Amit Patel', email: 'amit@example.com', kycStatus: 'pending', documentsVerified: 1, createdAt: new Date(Date.now() - 3600000) },
          { id: '4', name: 'Sanjana Desai', email: 'sanjana@example.com', kycStatus: 'submitted', documentsVerified: 2, createdAt: new Date(Date.now() - 7200000) },
          { id: '5', name: 'Vikram Reddy', email: 'vikram@example.com', kycStatus: 'rejected', documentsVerified: 0, createdAt: new Date(Date.now() - 259200000) },
        ]

        setUsers(mockUsers)
        setMetrics({
          totalUsers: mockUsers.length,
          verifiedUsers: mockUsers.filter(u => u.kycStatus === 'verified').length,
          pendingKYC: mockUsers.filter(u => u.kycStatus === 'pending').length,
          rejectedKYC: mockUsers.filter(u => u.kycStatus === 'rejected').length,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = filterStatus === 'all'
    ? users
    : users.filter(u => u.kycStatus === filterStatus)

  const getKYCStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Justice Desk Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">User management and KYC verification</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusCard
            title="Total Users"
            status={metrics.totalUsers > 0 ? 'healthy' : 'unavailable'}
            value={metrics.totalUsers}
            details="All registered professionals"
          />
          <StatusCard
            title="KYC Verified"
            status={metrics.verifiedUsers > 0 ? 'healthy' : 'unavailable'}
            value={metrics.verifiedUsers}
            details="Verified from submitted documents"
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

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">KYC Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Documents</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getKYCStatusBadgeColor(user.kycStatus)}`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.documentsVerified}/3</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.createdAt.toLocaleDateString()}</td>
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
