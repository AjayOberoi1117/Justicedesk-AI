/**
 * CURRENT Admin Service
 *
 * Read-only integration with production CURRENT backend.
 * No mutations allowed - strictly data retrieval and metrics.
 *
 * Production: https://api.current.com/api
 * Development: http://localhost:3000/api/current
 */

import { AxiosError } from 'axios'
import { apiClient } from '../api/client'
import { ProductMode } from '../types'

/**
 * News provider status
 */
export type ProviderStatus = 'healthy' | 'degraded' | 'unavailable'

/**
 * News provider metadata
 */
export interface Provider {
  id: string
  name: string
  status: ProviderStatus
  storiesCount: number
  lastUpdate: string // ISO 8601
  errorRate: number
}

/**
 * News story metadata
 */
export interface Story {
  id: string
  title: string
  description: string
  source: string
  publishedAt: string // ISO 8601
  category: string
  url: string
  views: number
  sentiment: 'positive' | 'neutral' | 'negative'
}

/**
 * Dashboard metrics for CURRENT
 */
export interface CurrentMetrics {
  totalStories: number
  freshStories24h: number
  lastFetch: string // ISO 8601
  healthyProviders: number
  degradedProviders: number
}

/**
 * API response envelope for provider lists
 */
export interface ProviderListResponse {
  data: Provider[]
}

/**
 * API response envelope for story lists
 */
export interface StoryListResponse {
  data: Story[]
  total: number
  limit: number
  offset: number
}

/**
 * API response envelope for single story
 */
export interface StoryDetailResponse extends Story {}

/**
 * API response envelope for metrics
 */
export interface CurrentMetricsResponse extends CurrentMetrics {}

/**
 * Validation helpers (fail-safe parsing)
 */
const validators = {
  isValidProviderStatus: (value: unknown): value is ProviderStatus => {
    return typeof value === 'string' && ['healthy', 'degraded', 'unavailable'].includes(value)
  },

  isValidSentiment: (value: unknown): value is 'positive' | 'neutral' | 'negative' => {
    return typeof value === 'string' && ['positive', 'neutral', 'negative'].includes(value)
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

  isValidProvider: (obj: unknown): obj is Provider => {
    if (!obj || typeof obj !== 'object') return false
    const p = obj as Record<string, unknown>
    return (
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      validators.isValidProviderStatus(p.status) &&
      typeof p.storiesCount === 'number' &&
      validators.isValidISODate(p.lastUpdate) &&
      typeof p.errorRate === 'number'
    )
  },

  isValidStory: (obj: unknown): obj is Story => {
    if (!obj || typeof obj !== 'object') return false
    const s = obj as Record<string, unknown>
    return (
      typeof s.id === 'string' &&
      typeof s.title === 'string' &&
      typeof s.description === 'string' &&
      typeof s.source === 'string' &&
      validators.isValidISODate(s.publishedAt) &&
      typeof s.category === 'string' &&
      typeof s.url === 'string' &&
      typeof s.views === 'number' &&
      validators.isValidSentiment(s.sentiment)
    )
  },

  isValidCurrentMetrics: (obj: unknown): obj is CurrentMetrics => {
    if (!obj || typeof obj !== 'object') return false
    const m = obj as Record<string, unknown>
    return (
      typeof m.totalStories === 'number' &&
      typeof m.freshStories24h === 'number' &&
      validators.isValidISODate(m.lastFetch) &&
      typeof m.healthyProviders === 'number' &&
      typeof m.degradedProviders === 'number'
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
 * Service for CURRENT admin operations (read-only)
 */
class CurrentService {
  private product: ProductMode = 'current'

  /**
   * List news providers with status
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async listProviders(): Promise<Provider[]> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<ProviderListResponse>('/providers')

      // Validate response schema
      if (!Array.isArray(response.data.data)) {
        throw new Error('Invalid response schema: data is not an array')
      }

      // Validate each provider record
      const validatedProviders = response.data.data.filter((provider) => {
        if (!validators.isValidProvider(provider)) {
          console.warn('Skipping invalid provider record:', provider)
          return false
        }
        return true
      })

      if (validatedProviders.length < response.data.data.length) {
        console.warn(`Filtered out ${response.data.data.length - validatedProviders.length} invalid provider records`)
      }

      return validatedProviders
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * List stories with optional filtering and pagination
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async listStories(options?: {
    limit?: number
    offset?: number
    search?: string
  }): Promise<Story[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', String(Math.min(options.limit, 100)))
      if (options?.offset) params.append('offset', String(options.offset))
      if (options?.search) params.append('search', options.search)

      const client = apiClient.getClient(this.product)
      const response = await client.get<StoryListResponse>('/stories', {
        params: Object.fromEntries(params),
      })

      // Validate response schema
      if (!Array.isArray(response.data.data)) {
        throw new Error('Invalid response schema: data is not an array')
      }

      // Validate each story record
      const validatedStories = response.data.data.filter((story) => {
        if (!validators.isValidStory(story)) {
          console.warn('Skipping invalid story record:', story)
          return false
        }
        return true
      })

      if (validatedStories.length < response.data.data.length) {
        console.warn(`Filtered out ${response.data.data.length - validatedStories.length} invalid story records`)
      }

      return validatedStories
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Get single story with full details
   * @throws {APIError} if validation fails, story not found, or backend is unreachable
   */
  async getStoryDetail(storyId: string): Promise<Story> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<StoryDetailResponse>(`/stories/${storyId}`)

      // Validate response schema
      if (!validators.isValidStory(response.data)) {
        throw new Error('Invalid response schema: story structure mismatch')
      }

      return response.data
    } catch (error) {
      throw this.parseError(error)
    }
  }

  /**
   * Get dashboard metrics
   * @throws {APIError} if validation fails or backend is unreachable
   */
  async getMetrics(): Promise<CurrentMetrics> {
    try {
      const client = apiClient.getClient(this.product)
      const response = await client.get<CurrentMetricsResponse>('/metrics')

      // Validate response schema
      if (!validators.isValidCurrentMetrics(response.data)) {
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

export const currentService = new CurrentService()
