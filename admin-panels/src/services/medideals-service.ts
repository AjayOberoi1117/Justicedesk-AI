/**
 * MediDeals Admin Service
 *
 * Read-only integration with production MediDeals backend.
 * No mutations allowed - strictly data retrieval and metrics.
 *
 * Production: https://api.medideals.com/api
 * Development: http://localhost:3003/api/medideals
 */

import { AxiosError } from 'axios'
import { apiClient } from '../api/client'
import { ProductMode } from '../types'

/**
 * User roles in MediDeals
 */
export type UserRole = 'retailer' | 'distributor' | 'vendor'

/**
 * KYC verification status
 */
export type KYCStatus = 'verified' | 'pending' | 'rejected'

/**
 * Document verification status
 */
export type DocumentStatus = 'verified' | 'pending' | 'rejected'

/**
 * Order status types
 */
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

/**
 * Payment status types
 */
export type PaymentStatus = 'pending' | 'partial' | 'full' | 'refunded'

/**
 * User/business profile with KYC information
 */
export interface MDUser {
  id: string
  name: string
  company: string
  role: UserRole
  email: string
  phone?: string
  kycStatus: KYCStatus
  documents: {
    gst: DocumentStatus
    drug_license: DocumentStatus
    pan: DocumentStatus
  }
  createdAt: string // ISO 8601
  lastUpdate?: string // ISO 8601
}

/**
 * Product listing
 */
export interface MDProduct {
  id: string
  name: string
  category: string
  seller: string
  price: number
  quantity: number
  unit: string
  createdAt: string // ISO 8601
}

/**
 * Order record
 */
export interface MDOrder {
  id: string
  orderId: string
  buyer: string
  seller: string
  items: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  advancePayment: number
  remainingBalance: number
  shippingMethod: string
  createdAt: string // ISO 8601
  estimatedDelivery: string // ISO 8601
}

/**
 * Dashboard metrics for MediDeals
 */
export interface MediDealsMetrics {
  totalUsers: number
  retailers: number
  distributors: number
  vendors: number
  kycVerified: number
  totalOrders: number
  revenue: number
  verificationRate: string // percentage as string "85.5"
}

/**
 * API response envelope for user lists
 */
export interface UserListResponse {
  data: MDUser[]
  total: number
  limit: number
  offset: number
}

/**
 * API response envelope for single user
 */
export interface UserDetailResponse extends MDUser {}

/**
 * API response envelope for product lists
 */
export interface ProductListResponse {
  data: MDProduct[]
  total: number
  limit: number
  offset: number
}

/**
 * API response envelope for single product
 */
export interface ProductDetailResponse extends MDProduct {}

/**
 * API response envelope for order lists
 */
export interface OrderListResponse {
  data: MDOrder[]
  total: number
  limit: number
  offset: number
}

/**
 * API response envelope for single order
 */
export interface OrderDetailResponse extends MDOrder {}

/**
 * API response envelope for metrics
 */
export interface MediDealsMetricsResponse extends MediDealsMetrics {}

/**
 * Validation helpers (fail-safe parsing)
 */
const validators = {
  isValidUserRole: (value: unknown): value is UserRole => {
    return typeof value === 'string' && ['retailer', 'distributor', 'vendor'].includes(value)
  },

  isValidKYCStatus: (value: unknown): value is KYCStatus => {
    return typeof value === 'string' && ['verified', 'pending', 'rejected'].includes(value)
  },

  isValidDocumentStatus: (value: unknown): value is DocumentStatus => {
    return typeof value === 'string' && ['verified', 'pending', 'rejected'].includes(value)
  },

  isValidOrderStatus: (value: unknown): value is OrderStatus => {
    return typeof value === 'string' && ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(value)
  },

  isValidPaymentStatus: (value: unknown): value is PaymentStatus => {
    return typeof value === 'string' && ['pending', 'partial', 'full', 'refunded'].includes(value)
  },

  isValidISODate: (value: unknown): value is string => {
    if (typeof value !== 'string') return false
    try {
      new Date(value).toISOString()
      return true
    } catch {
      return false
    }
  },

  isValidMDUser: (obj: unknown): obj is MDUser => {
    if (!obj || typeof obj !== 'object') return false
    const u = obj as Record<string, unknown>
    return (
      typeof u.id === 'string' &&
      typeof u.name === 'string' &&
      typeof u.company === 'string' &&
      validators.isValidUserRole(u.role) &&
      typeof u.email === 'string' &&
      validators.isValidKYCStatus(u.kycStatus) &&
      typeof u.documents === 'object' &&
      u.documents !== null &&
      validators.isValidDocumentStatus((u.documents as Record<string, unknown>).gst) &&
      validators.isValidDocumentStatus((u.documents as Record<string, unknown>).drug_license) &&
      validators.isValidDocumentStatus((u.documents as Record<string, unknown>).pan) &&
      validators.isValidISODate(u.createdAt)
    )
  },

  isValidMDProduct: (obj: unknown): obj is MDProduct => {
    if (!obj || typeof obj !== 'object') return false
    const p = obj as Record<string, unknown>
    return (
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      typeof p.category === 'string' &&
      typeof p.seller === 'string' &&
      typeof p.price === 'number' &&
      typeof p.quantity === 'number' &&
      typeof p.unit === 'string' &&
      validators.isValidISODate(p.createdAt)
    )
  },

  isValidMDOrder: (obj: unknown): obj is MDOrder => {
    if (!obj || typeof obj !== 'object') return false
    const o = obj as Record<string, unknown>
    return (
      typeof o.id === 'string' &&
      typeof o.orderId === 'string' &&
      typeof o.buyer === 'string' &&
      typeof o.seller === 'string' &&
      typeof o.items === 'number' &&
      typeof o.total === 'number' &&
      validators.isValidOrderStatus(o.status) &&
      validators.isValidPaymentStatus(o.paymentStatus) &&
      typeof o.advancePayment === 'number' &&
      typeof o.remainingBalance === 'number' &&
      typeof o.shippingMethod === 'string' &&
      validators.isValidISODate(o.createdAt) &&
      validators.isValidISODate(o.estimatedDelivery)
    )
  },

  isValidMediDealsMetrics: (obj: unknown): obj is MediDealsMetrics => {
    if (!obj || typeof obj !== 'object') return false
    const m = obj as Record<string, unknown>
    return (
      typeof m.totalUsers === 'number' &&
      typeof m.retailers === 'number' &&
      typeof m.distributors === 'number' &&
      typeof m.vendors === 'number' &&
      typeof m.kycVerified === 'number' &&
      typeof m.totalOrders === 'number' &&
      typeof m.revenue === 'number' &&
      typeof m.verificationRate === 'string'
    )
  },
}

/**
 * API error response
 */
export interface APIError {
  status: number
  code: string
  message: string
  timestamp: string
}

/**
 * Service for MediDeals admin operations (read-only)
 */
class MediDealsService {
  private product: ProductMode = 'medideals'

  /**
   * List users with optional filtering and pagination
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async listUsers(options?: {
    limit?: number
    offset?: number
    role?: UserRole
    kycStatus?: KYCStatus
    search?: string
  }): Promise<MDUser[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', String(Math.min(options.limit, 100)))
      if (options?.offset) params.append('offset', String(options.offset))
      if (options?.role) params.append('role', options.role)
      if (options?.kycStatus) params.append('kycStatus', options.kycStatus)
      if (options?.search) params.append('search', options.search)

      const client = apiClient.getClient(this.product)
      const response = await client.get<UserListResponse>('/users', {
        params: Object.fromEntries(params),
      })

      // Validate response schema
      if (!Array.isArray(response.data.data)) {
        throw new Error('Invalid response schema: data is not an array')
      }

      // Validate each user record
      const validatedUsers = response.data.data.filter((user) => {
        if (!validators.isValidMDUser(user)) {
          console.warn('Skipping invalid user record:', user)
          return false
        }
        return true
      })

      if (validatedUsers.length < response.data.data.length) {
        console.warn(`Filtered out ${response.data.data.length - validatedUsers.length} invalid user records`)
      }

      return validatedUsers
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Get single user with full details
   * @throws {APIError} if validation fails, user not found, or backend is unreachable
   */
  async getUserDetail(userId: string): Promise<MDUser> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<UserDetailResponse>(`/users/${userId}`)

      // Validate response schema
      if (!validators.isValidMDUser(response.data)) {
        throw new Error('Invalid response schema: user structure mismatch')
      }

      return response.data
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * List products with optional filtering and pagination
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async listProducts(options?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<MDProduct[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', String(Math.min(options.limit, 100)))
      if (options?.offset) params.append('offset', String(options.offset))
      if (options?.search) params.append('search', options.search)

      const client = apiClient.getClient(this.product)
      const response = await client.get<ProductListResponse>('/products', {
        params: Object.fromEntries(params),
      })

      // Validate response schema
      if (!Array.isArray(response.data.data)) {
        throw new Error('Invalid response schema: data is not an array')
      }

      // Validate each product record
      const validatedProducts = response.data.data.filter((product) => {
        if (!validators.isValidMDProduct(product)) {
          console.warn('Skipping invalid product record:', product)
          return false
        }
        return true
      })

      if (validatedProducts.length < response.data.data.length) {
        console.warn(`Filtered out ${response.data.data.length - validatedProducts.length} invalid product records`)
      }

      return validatedProducts
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Get single product with full details
   * @throws {APIError} if validation fails, product not found, or backend is unreachable
   */
  async getProductDetail(productId: string): Promise<MDProduct> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<ProductDetailResponse>(`/products/${productId}`)

      // Validate response schema
      if (!validators.isValidMDProduct(response.data)) {
        throw new Error('Invalid response schema: product structure mismatch')
      }

      return response.data
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * List orders with optional filtering and pagination
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async listOrders(options?: {
    limit?: number
    offset?: number
    status?: OrderStatus
  }): Promise<MDOrder[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', String(Math.min(options.limit, 100)))
      if (options?.offset) params.append('offset', String(options.offset))
      if (options?.status) params.append('status', options.status)

      const client = apiClient.getClient(this.product)
      const response = await client.get<OrderListResponse>('/orders', {
        params: Object.fromEntries(params),
      })

      // Validate response schema
      if (!Array.isArray(response.data.data)) {
        throw new Error('Invalid response schema: data is not an array')
      }

      // Validate each order record
      const validatedOrders = response.data.data.filter((order) => {
        if (!validators.isValidMDOrder(order)) {
          console.warn('Skipping invalid order record:', order)
          return false
        }
        return true
      })

      if (validatedOrders.length < response.data.data.length) {
        console.warn(`Filtered out ${response.data.data.length - validatedOrders.length} invalid order records`)
      }

      return validatedOrders
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Get single order with full details
   * @throws {APIError} if validation fails, order not found, or backend is unreachable
   */
  async getOrderDetail(orderId: string): Promise<MDOrder> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<OrderDetailResponse>(`/orders/${orderId}`)

      // Validate response schema
      if (!validators.isValidMDOrder(response.data)) {
        throw new Error('Invalid response schema: order structure mismatch')
      }

      return response.data
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Get KYC and business metrics for dashboard
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async getMetrics(): Promise<MediDealsMetrics> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<MediDealsMetricsResponse>('/kyc/metrics')

      // Validate response schema
      if (!validators.isValidMediDealsMetrics(response.data)) {
        throw new Error('Invalid response schema: metrics structure mismatch')
      }

      return response.data
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Check backend connectivity
   */
  async checkHealth(): Promise<boolean> {
    try {
      const result = await apiClient.checkHealth(this.product)
      return result.connected
    } catch {
      return false
    }
  }

  /**
   * Parse and normalize errors
   */
  private parseError(error: unknown): APIError {
    const now = new Date().toISOString()

    if (error instanceof TypeError) {
      // Network error (TypeError: Failed to fetch)
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Network error - backend unreachable',
        timestamp: now,
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return {
          status: 0,
          code: 'TIMEOUT',
          message: 'Request timeout - backend not responding',
          timestamp: now,
        }
      }

      if (error.message.includes('Invalid response schema')) {
        return {
          status: 0,
          code: 'SCHEMA_VALIDATION_ERROR',
          message: 'Backend returned invalid data format',
          timestamp: now,
        }
      }
    }

    // Axios error
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as AxiosError
      const status = axiosError.response?.status || 0
      const data = axiosError.response?.data

      let code = 'UNKNOWN_ERROR'
      let message = 'Unknown error'

      if (status === 401) {
        code = 'UNAUTHORIZED'
        message = 'Authentication required'
      } else if (status === 403) {
        code = 'PERMISSION_DENIED'
        message = 'Access denied'
      } else if (status === 404) {
        code = 'NOT_FOUND'
        message = 'Resource not found'
      } else if (status === 429) {
        code = 'RATE_LIMITED'
        message = 'Too many requests - rate limited'
      } else if (status >= 500) {
        code = 'SERVER_ERROR'
        message = 'Backend server error'
      }

      return {
        status,
        code,
        message: typeof data === 'object' && data !== null && 'message' in data && typeof (data as Record<string, unknown>).message === 'string' ? (data as Record<string, unknown>).message as string : message,
        timestamp: now,
      }
    }

    return {
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      timestamp: now,
    }
  }
}

export const mediDealsService = new MediDealsService()
