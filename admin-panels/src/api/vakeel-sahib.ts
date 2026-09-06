import { apiClient } from './client'
import { VSAdvocate } from '../types'

export const vakeelSahibAPI = {
  async getAdvocates(limit: number = 50, offset: number = 0, kycStatus?: string) {
    try {
      const client = apiClient.getClient('vakeel-sahib')
      const response = await client.get('/advocates', {
        params: { limit, offset, ...(kycStatus && { kycStatus }) },
      })
      return response.data as VSAdvocate[]
    } catch (error) {
      console.error('Failed to fetch advocates:', error)
      throw error
    }
  },

  async getAdvocate(advocateId: string) {
    try {
      const client = apiClient.getClient('vakeel-sahib')
      const response = await client.get(`/advocates/${advocateId}`)
      return response.data as VSAdvocate
    } catch (error) {
      console.error('Failed to fetch advocate:', error)
      throw error
    }
  },

  async getKYCMetrics() {
    try {
      const client = apiClient.getClient('vakeel-sahib')
      const response = await client.get('/kyc/metrics')
      return response.data
    } catch (error) {
      console.error('Failed to fetch KYC metrics:', error)
      throw error
    }
  },

  async verifyBarEnrollment(advocateId: string) {
    try {
      const client = apiClient.getClient('vakeel-sahib')
      const response = await client.post(`/advocates/${advocateId}/bar-enrollment/verify`)
      return response.data
    } catch (error) {
      console.error('Failed to verify bar enrollment:', error)
      throw error
    }
  },

  async verifyPAN(advocateId: string) {
    try {
      const client = apiClient.getClient('vakeel-sahib')
      const response = await client.post(`/advocates/${advocateId}/pan/verify`)
      return response.data
    } catch (error) {
      console.error('Failed to verify PAN:', error)
      throw error
    }
  },

  async rejectAdvocate(advocateId: string, reason: string) {
    try {
      const client = apiClient.getClient('vakeel-sahib')
      const response = await client.post(`/advocates/${advocateId}/reject`, { reason })
      return response.data
    } catch (error) {
      console.error('Failed to reject advocate:', error)
      throw error
    }
  },
}
