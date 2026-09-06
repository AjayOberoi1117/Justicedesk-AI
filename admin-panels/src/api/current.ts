import { apiClient } from './client'
import { CurrentMetrics } from '../types'

export const currentAPI = {
  async getMetrics(): Promise<CurrentMetrics> {
    try {
      const client = apiClient.getClient('current')
      const response = await client.get('/metrics')
      return response.data
    } catch (error) {
      console.error('Failed to fetch CURRENT metrics:', error)
      throw error
    }
  },

  async getProviders() {
    try {
      const client = apiClient.getClient('current')
      const response = await client.get('/providers')
      return response.data
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      throw error
    }
  },

  async triggerIngestion() {
    try {
      const client = apiClient.getClient('current')
      const response = await client.post('/ingestion/trigger')
      return response.data
    } catch (error) {
      console.error('Failed to trigger ingestion:', error)
      throw error
    }
  },

  async getStories(limit: number = 50, offset: number = 0) {
    try {
      const client = apiClient.getClient('current')
      const response = await client.get('/stories', { params: { limit, offset } })
      return response.data
    } catch (error) {
      console.error('Failed to fetch stories:', error)
      throw error
    }
  },
}
