/**
 * @vitest environment jsdom
 * MediDeals Service Tests - 25+ Scenarios
 * Comprehensive validation of read-only integration, role-based filtering, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mediDealsService } from '../medideals-service'
import { apiClient } from '../../api/client'

vi.mock('../../api/client')

describe('MediDeals Service - Read-Only Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // User listing tests
  describe('listUsers', () => {
    it('should return array of validated users', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'user-1',
                name: 'Sharma Pharmacy',
                company: 'Sharma Group',
                role: 'retailer',
                email: 'user1@medideals.com',
                phone: '+91-7000000001',
                kycStatus: 'verified',
                documents: {
                  gst: 'verified',
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
                lastUpdate: new Date().toISOString(),
              },
            ],
            total: 80,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const users = await mediDealsService.listUsers()
      expect(users).toHaveLength(1)
      expect(users[0].name).toBe('Sharma Pharmacy')
      expect(users[0].role).toBe('retailer')
    })

    it('should filter users by role (retailer)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'user-1',
                name: 'Sharma Pharmacy',
                company: 'Sharma Group',
                role: 'retailer',
                email: 'user1@medideals.com',
                phone: '+91-7000000001',
                kycStatus: 'verified',
                documents: {
                  gst: 'verified',
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
              },
            ],
            total: 456,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ role: 'retailer' })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ role: 'retailer' }),
      }))
    })

    it('should filter users by role (distributor)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 345,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ role: 'distributor' })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ role: 'distributor' }),
      }))
    })

    it('should filter users by role (vendor)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 433,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ role: 'vendor' })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ role: 'vendor' }),
      }))
    })

    it('should filter users by KYC status', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'user-1',
                name: 'Sharma Pharmacy',
                company: 'Sharma Group',
                role: 'retailer',
                email: 'user1@medideals.com',
                kycStatus: 'verified',
                documents: {
                  gst: 'verified',
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1100,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ kycStatus: 'verified' })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ kycStatus: 'verified' }),
      }))
    })

    it('should support search filtering', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ search: 'Sharma' })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ search: 'Sharma' }),
      }))
    })

    it('should enforce limit cap at 100', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 100,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ limit: 500 })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ limit: '100' }),
      }))
    })

    it('should filter out invalid user records', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'user-1',
                name: 'Sharma Pharmacy',
                company: 'Sharma Group',
                role: 'retailer',
                email: 'user1@medideals.com',
                kycStatus: 'verified',
                documents: {
                  gst: 'verified',
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
              },
              {
                id: 'user-2',
                name: 'Invalid User',
                company: 'Invalid Company',
                role: 'invalid_role', // invalid role
                email: 'user2@medideals.com',
                kycStatus: 'verified',
                documents: {
                  gst: 'verified',
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
              },
            ],
            total: 2,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const users = await mediDealsService.listUsers()
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe('user-1')
    })

    it('should handle empty user list', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const users = await mediDealsService.listUsers()
      expect(users).toEqual([])
    })
  })

  // User detail tests
  describe('getUserDetail', () => {
    it('should return single user with full details', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            name: 'Sharma Pharmacy',
            company: 'Sharma Group',
            role: 'retailer',
            email: 'user1@medideals.com',
            phone: '+91-7000000001',
            kycStatus: 'verified',
            documents: {
              gst: 'verified',
              drug_license: 'verified',
              pan: 'verified',
            },
            createdAt: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const user = await mediDealsService.getUserDetail('user-1')
      expect(user.id).toBe('user-1')
      expect(user.name).toBe('Sharma Pharmacy')
      expect(mockClient.get).toHaveBeenCalledWith('/users/user-1')
    })

    it('should validate user schema', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'user-1',
            name: 'Sharma Pharmacy',
            company: 'Sharma Group',
            role: 'retailer',
            email: 'user1@medideals.com',
            kycStatus: 'invalid_status', // invalid
            documents: {
              gst: 'verified',
              drug_license: 'verified',
              pan: 'verified',
            },
            createdAt: new Date().toISOString(),
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await expect(mediDealsService.getUserDetail('user-1')).rejects.toThrow()
    })
  })

  // Product listing tests
  describe('listProducts', () => {
    it('should return array of validated products', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'product-1',
                name: 'Aspirin 500mg',
                category: 'analgesics',
                seller: 'Seller 1',
                price: 150,
                quantity: 1000,
                unit: 'box',
                createdAt: new Date().toISOString(),
              },
            ],
            total: 50,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const products = await mediDealsService.listProducts()
      expect(products).toHaveLength(1)
      expect(products[0].name).toBe('Aspirin 500mg')
    })

    it('should support product search', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listProducts({ search: 'Aspirin' })
      expect(mockClient.get).toHaveBeenCalledWith('/products', expect.any(Object))
    })
  })

  // Product detail tests
  describe('getProductDetail', () => {
    it('should return single product', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'product-1',
            name: 'Aspirin 500mg',
            category: 'analgesics',
            seller: 'Seller 1',
            price: 150,
            quantity: 1000,
            unit: 'box',
            createdAt: new Date().toISOString(),
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const product = await mediDealsService.getProductDetail('product-1')
      expect(product.id).toBe('product-1')
      expect(mockClient.get).toHaveBeenCalledWith('/products/product-1')
    })
  })

  // Order listing tests
  describe('listOrders', () => {
    it('should return array of validated orders', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'order-1',
                orderId: 'ORD-000001',
                buyer: 'Buyer 1',
                seller: 'Seller 1',
                items: 10,
                total: 15000,
                status: 'confirmed',
                paymentStatus: 'full',
                advancePayment: 1500,
                remainingBalance: 13500,
                shippingMethod: 'medideals',
                createdAt: new Date().toISOString(),
                estimatedDelivery: new Date(Date.now() + 86400000 * 5).toISOString(),
              },
            ],
            total: 100,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const orders = await mediDealsService.listOrders()
      expect(orders).toHaveLength(1)
      expect(orders[0].status).toBe('confirmed')
    })

    it('should filter orders by status (pending)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listOrders({ status: 'pending' })
      expect(mockClient.get).toHaveBeenCalledWith('/orders', expect.objectContaining({
        params: expect.objectContaining({ status: 'pending' }),
      }))
    })

    it('should filter orders by status (delivered)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listOrders({ status: 'delivered' })
      expect(mockClient.get).toHaveBeenCalledWith('/orders', expect.objectContaining({
        params: expect.objectContaining({ status: 'delivered' }),
      }))
    })

    it('should filter orders by status (cancelled)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 0,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listOrders({ status: 'cancelled' })
      expect(mockClient.get).toHaveBeenCalledWith('/orders', expect.objectContaining({
        params: expect.objectContaining({ status: 'cancelled' }),
      }))
    })
  })

  // Order detail tests
  describe('getOrderDetail', () => {
    it('should return single order', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'order-1',
            orderId: 'ORD-000001',
            buyer: 'Buyer 1',
            seller: 'Seller 1',
            items: 10,
            total: 15000,
            status: 'confirmed',
            paymentStatus: 'full',
            advancePayment: 1500,
            remainingBalance: 13500,
            shippingMethod: 'medideals',
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 86400000 * 5).toISOString(),
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const order = await mediDealsService.getOrderDetail('order-1')
      expect(order.id).toBe('order-1')
      expect(mockClient.get).toHaveBeenCalledWith('/orders/order-1')
    })
  })

  // Metrics tests
  describe('getMetrics', () => {
    it('should return dashboard metrics', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            totalUsers: 1234,
            retailers: 456,
            distributors: 345,
            vendors: 433,
            kycVerified: 1100,
            totalOrders: 5678,
            revenue: 2345678,
            verificationRate: '89.3',
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const metrics = await mediDealsService.getMetrics()
      expect(metrics.totalUsers).toBe(1234)
      expect(metrics.retailers).toBe(456)
      expect(metrics.verificationRate).toBe('89.3')
    })

    it('should validate metrics schema', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            totalUsers: 'invalid', // invalid type
            retailers: 456,
            distributors: 345,
            vendors: 433,
            kycVerified: 1100,
            totalOrders: 5678,
            revenue: 2345678,
            verificationRate: '89.3',
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await expect(mediDealsService.getMetrics()).rejects.toThrow()
    })
  })

  // Health check tests
  describe('checkHealth', () => {
    it('should return true when backend is reachable', async () => {
      vi.mocked(apiClient.checkHealth).mockResolvedValue({ connected: true })

      const healthy = await mediDealsService.checkHealth()
      expect(healthy).toBe(true)
    })

    it('should return false when backend is unreachable', async () => {
      vi.mocked(apiClient.checkHealth).mockResolvedValue({ connected: false })

      const healthy = await mediDealsService.checkHealth()
      expect(healthy).toBe(false)
    })
  })

  // Error handling tests
  describe('Error Handling - 8 Error Codes', () => {
    it('UNAUTHORIZED (401) error', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 401 },
          isAxiosError: true,
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.listUsers()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.status).toBe(401)
        expect(error.code).toBe('UNAUTHORIZED')
      }
    })

    it('PERMISSION_DENIED (403) error', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 403 },
          isAxiosError: true,
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.listUsers()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.status).toBe(403)
        expect(error.code).toBe('PERMISSION_DENIED')
      }
    })

    it('NOT_FOUND (404) error', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 404 },
          isAxiosError: true,
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.getUserDetail('nonexistent')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.status).toBe(404)
        expect(error.code).toBe('NOT_FOUND')
      }
    })

    it('RATE_LIMITED (429) error', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 429 },
          isAxiosError: true,
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.listOrders()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.status).toBe(429)
        expect(error.code).toBe('RATE_LIMITED')
      }
    })

    it('SERVER_ERROR (500) error', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 500 },
          isAxiosError: true,
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.getMetrics()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.status).toBe(500)
        expect(error.code).toBe('SERVER_ERROR')
      }
    })

    it('TIMEOUT error', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue(new Error('Request timeout')),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.listUsers()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.code).toBe('TIMEOUT')
      }
    })

    it('NETWORK_ERROR (TypeError) handling', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.listOrders()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.code).toBe('NETWORK_ERROR')
      }
    })

    it('SCHEMA_VALIDATION_ERROR', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: 'not an array',
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await mediDealsService.listUsers()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.code).toBe('SCHEMA_VALIDATION_ERROR')
      }
    })
  })

  // Document status validation tests
  describe('Document Status Validation', () => {
    it('should validate document statuses correctly', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'user-1',
                name: 'Sharma Pharmacy',
                company: 'Sharma Group',
                role: 'retailer',
                email: 'user1@medideals.com',
                kycStatus: 'verified',
                documents: {
                  gst: 'pending', // pending status
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const users = await mediDealsService.listUsers()
      expect(users).toHaveLength(1)
      expect(users[0].documents.gst).toBe('pending')
    })

    it('should reject invalid document statuses', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'user-1',
                name: 'Sharma Pharmacy',
                company: 'Sharma Group',
                role: 'retailer',
                email: 'user1@medideals.com',
                kycStatus: 'verified',
                documents: {
                  gst: 'invalid_status', // invalid
                  drug_license: 'verified',
                  pan: 'verified',
                },
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const users = await mediDealsService.listUsers()
      expect(users).toHaveLength(0)
    })
  })

  // Pagination tests
  describe('Pagination', () => {
    it('should handle offset correctly', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
            total: 100,
            limit: 50,
            offset: 50,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await mediDealsService.listUsers({ offset: 50 })
      expect(mockClient.get).toHaveBeenCalledWith('/users', expect.objectContaining({
        params: expect.objectContaining({ offset: '50' }),
      }))
    })
  })
})
