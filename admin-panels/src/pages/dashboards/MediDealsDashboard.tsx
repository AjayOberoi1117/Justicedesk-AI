import { useEffect, useState } from 'react'
import { useAppStore } from '../../store'
import StatusCard from '../../components/StatusCard'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import { RefreshCw, Filter } from 'lucide-react'
import { mediDealsService, MDUser as ServiceMDUser, MDOrder as ServiceMDOrder } from '../../services/medideals-service'

interface MDUser extends ServiceMDUser {
  createdAt: Date
}

interface MDOrder extends ServiceMDOrder {
  createdAt: Date
}

export default function MediDealsDashboard() {
  const backendStatus = useAppStore(s => s.backendStatus[s.productMode!])
  const [users, setUsers] = useState<MDUser[]>([])
  const [orders, setOrders] = useState<MDOrder[]>([])
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    retailers: 0,
    distributors: 0,
    vendors: 0,
    kycVerified: 0,
    totalOrders: 0,
    revenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<'all' | 'retailer' | 'distributor' | 'vendor'>('all')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch real data from MediDeals backend
      const [userList, orderList, metricsData] = await Promise.all([
        mediDealsService.listUsers({ limit: 100 }),
        mediDealsService.listOrders({ limit: 100 }),
        mediDealsService.getMetrics(),
      ])

      // Transform data to include Date objects
      const transformedUsers: MDUser[] = userList.map(u => ({
        ...u,
        createdAt: new Date(u.createdAt),
      }))

      const transformedOrders: MDOrder[] = orderList.map(o => ({
        ...o,
        createdAt: new Date(o.createdAt),
        estimatedDelivery: new Date(o.estimatedDelivery),
      }))

      setUsers(transformedUsers)
      setOrders(transformedOrders)

      setMetrics({
        totalUsers: metricsData.totalUsers,
        retailers: metricsData.retailers,
        distributors: metricsData.distributors,
        vendors: metricsData.vendors,
        kycVerified: metricsData.kycVerified,
        totalOrders: metricsData.totalOrders,
        revenue: metricsData.revenue,
      })
    } catch (err) {
      // Fail-closed: show error, no mock data fallback
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data from backend'
      setError(errorMessage)
      setUsers([])
      setOrders([])
      setMetrics({
        totalUsers: 0,
        retailers: 0,
        distributors: 0,
        vendors: 0,
        kycVerified: 0,
        totalOrders: 0,
        revenue: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(u => u.role === filterRole)

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'retailer': return 'bg-blue-100 text-blue-800'
      case 'distributor': return 'bg-green-100 text-green-800'
      case 'vendor': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MediDeals Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">B2B pharma marketplace management</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
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

        {/* Business Model Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Retailer</h4>
            <p className="text-blue-800">Buy only • GST optional</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Distributor/Wholesaler</h4>
            <p className="text-green-800">Buy and sell • GST mandatory</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Vendor/Seller</h4>
            <p className="text-purple-800">Sell only • GST mandatory</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusCard
            title="Total Users"
            status={metrics.totalUsers > 0 ? 'healthy' : 'unavailable'}
            value={metrics.totalUsers}
            details="All registered businesses"
          />
          <StatusCard
            title="KYC Verified"
            status={metrics.kycVerified > 0 ? 'healthy' : 'unavailable'}
            value={metrics.kycVerified}
            details="Verified businesses"
          />
          <StatusCard
            title="Total Orders"
            status={metrics.totalOrders > 0 ? 'healthy' : 'unavailable'}
            value={metrics.totalOrders}
            details="All-time orders"
          />
          <StatusCard
            title="Revenue"
            status={metrics.revenue > 0 ? 'healthy' : 'unavailable'}
            value={`₹${(metrics.revenue / 1000).toFixed(1)}K`}
            details="Total order value"
          />
        </div>

        {/* User Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusCard
            title="Retailers"
            status={metrics.retailers > 0 ? 'healthy' : 'unavailable'}
            value={metrics.retailers}
            details="Buying only"
          />
          <StatusCard
            title="Distributors"
            status={metrics.distributors > 0 ? 'healthy' : 'unavailable'}
            value={metrics.distributors}
            details="Buying and selling"
          />
          <StatusCard
            title="Vendors"
            status={metrics.vendors > 0 ? 'healthy' : 'unavailable'}
            value={metrics.vendors}
            details="Selling only"
          />
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="retailer">Retailer</option>
                <option value="distributor">Distributor</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Company</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Contact</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">KYC Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{user.company}</td>
                      <td className="px-6 py-4 text-gray-600">{user.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(user.kycStatus)}`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Orders</h2>

          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Order ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Buyer</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Seller</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Items</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{order.id}</td>
                      <td className="px-6 py-4 text-gray-600">{order.buyer}</td>
                      <td className="px-6 py-4 text-gray-600">{order.seller}</td>
                      <td className="px-6 py-4 text-gray-600">{order.items}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">₹{order.total.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{order.createdAt.toLocaleDateString()}</td>
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
