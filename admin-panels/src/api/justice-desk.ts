import { apiClient } from './client'
import { JDUser } from '../types'

export const justiceDeskaAPI = {
  async getUsers(limit: number = 50, offset: number = 0, kycStatus?: string) {
    try {
      const client = apiClient.getClient('justice-desk')
      const response = await client.get('/users', {
        params: { limit, offset, ...(kycStatus && { kycStatus }) },
      })
      return response.data as JDUser[]
    } catch (error) {
      console.error('Failed to fetch Justice Desk users:', error)
      throw error
    }
  },

  async getUser(userId: string) {
    try {
      const client = apiClient.getClient('justice-desk')
      const response = await client.get(`/users/${userId}`)
      return response.data as JDUser
    } catch (error) {
      console.error('Failed to fetch user:', error)
      throw error
    }
  },

  async getKYCMetrics() {
    try {
      const client = apiClient.getClient('justice-desk')
      const response = await client.get('/kyc/metrics')
      return response.data
    } catch (error) {
      console.error('Failed to fetch KYC metrics:', error)
      throw error
    }
  },

  async verifyDocument(userId: string, documentId: string) {
    try {
      const client = apiClient.getClient('justice-desk')
      const response = await client.post(`/users/${userId}/documents/${documentId}/verify`)
      return response.data
    } catch (error) {
      console.error('Failed to verify document:', error)
      throw error
    }
  },

  async rejectDocument(userId: string, documentId: string, reason: string) {
    try {
      const client = apiClient.getClient('justice-desk')
      const response = await client.post(`/users/${userId}/documents/${documentId}/reject`, {
        reason,
      })
      return response.data
    } catch (error) {
      console.error('Failed to reject document:', error)
      throw error
    }
  },
}
