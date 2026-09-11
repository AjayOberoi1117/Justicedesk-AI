import { apiClient } from './client'
import { MDUser, MDProduct, MDOrder } from '../types'

export const medidealsAPI = {
  // User Management
  async getUsers(limit: number = 50, offset: number = 0, role?: string) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get('/users', {
        params: { limit, offset, ...(role && { role }) },
      })
      return response.data as MDUser[]
    } catch (error) {
      console.error('Failed to fetch MediDeals users:', error)
      throw error
    }
  },

  async getUser(userId: string) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get(`/users/${userId}`)
      return response.data as MDUser
    } catch (error) {
      console.error('Failed to fetch user:', error)
      throw error
    }
  },

  // Product Management
  async getProducts(limit: number = 50, offset: number = 0) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get('/products', { params: { limit, offset } })
      return response.data as MDProduct[]
    } catch (error) {
      console.error('Failed to fetch products:', error)
      throw error
    }
  },

  async createProduct(product: Omit<MDProduct, 'id'>) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.post('/products', product)
      return response.data as MDProduct
    } catch (error) {
      console.error('Failed to create product:', error)
      throw error
    }
  },

  // Order Management
  async getOrders(limit: number = 50, offset: number = 0, status?: string) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get('/orders', {
        params: { limit, offset, ...(status && { status }) },
      })
      return response.data as MDOrder[]
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      throw error
    }
  },

  async getOrder(orderId: string) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get(`/orders/${orderId}`)
      return response.data as MDOrder
    } catch (error) {
      console.error('Failed to fetch order:', error)
      throw error
    }
  },

  async updateOrderStatus(orderId: string, status: MDOrder['status']) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.patch(`/orders/${orderId}/status`, { status })
      return response.data
    } catch (error) {
      console.error('Failed to update order status:', error)
      throw error
    }
  },

  // KYC & Verification
  async getKYCMetrics() {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get('/kyc/metrics')
      return response.data
    } catch (error) {
      console.error('Failed to fetch KYC metrics:', error)
      throw error
    }
  },

  async verifyUser(userId: string) {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.post(`/users/${userId}/verify`)
      return response.data
    } catch (error) {
      console.error('Failed to verify user:', error)
      throw error
    }
  },

  // Analytics & Reports
  async getDashboardMetrics() {
    try {
      const client = apiClient.getClient('medideals')
      const response = await client.get('/analytics/dashboard')
      return response.data
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
      throw error
    }
  },
}
