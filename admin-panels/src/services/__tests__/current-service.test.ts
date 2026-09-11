/**
 * @vitest environment jsdom
 * CURRENT Service Tests - 20+ Scenarios
 * Comprehensive validation of read-only integration and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { currentService } from '../current-service'
import { apiClient } from '../../api/client'

vi.mock('../../api/client')

describe('CURRENT Service - Read-Only Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Provider listing tests
  describe('listProviders', () => {
    it('should return array of validated providers', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'toi',
                name: 'Times of India',
                status: 'healthy',
                storiesCount: 245,
                lastUpdate: new Date().toISOString(),
                errorRate: 0,
              },
            ],
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const providers = await currentService.listProviders()
      expect(providers).toHaveLength(1)
      expect(providers[0].name).toBe('Times of India')
      expect(providers[0].status).toBe('healthy')
    })

    it('should filter out invalid provider records', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'toi',
                name: 'Times of India',
                status: 'healthy',
                storiesCount: 245,
                lastUpdate: new Date().toISOString(),
                errorRate: 0,
              },
              {
                id: 'invalid',
                name: 'Invalid Provider',
                status: 'invalid_status', // invalid status
                storiesCount: 245,
                lastUpdate: new Date().toISOString(),
                errorRate: 0,
              },
            ],
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const providers = await currentService.listProviders()
      expect(providers).toHaveLength(1)
      expect(providers[0].id).toBe('toi')
    })

    it('should throw error when response data is not an array', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: { invalid: 'structure' },
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await expect(currentService.listProviders()).rejects.toThrow()
    })

    it('should handle empty provider list', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [],
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const providers = await currentService.listProviders()
      expect(providers).toEqual([])
    })
  })

  // Story listing tests
  describe('listStories', () => {
    it('should return validated stories with pagination', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'story-1',
                title: 'Test Story',
                description: 'A test description',
                source: 'Times of India',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                url: 'https://example.com/story-1',
                views: 1000,
                sentiment: 'positive',
              },
            ],
            total: 250,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const stories = await currentService.listStories({ limit: 50, offset: 0 })
      expect(stories).toHaveLength(1)
      expect(stories[0].title).toBe('Test Story')
    })

    it('should support search filtering', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'story-1',
                title: 'Test Story',
                description: 'A test description',
                source: 'Times of India',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                url: 'https://example.com/story-1',
                views: 1000,
                sentiment: 'positive',
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const stories = await currentService.listStories({ search: 'technology' })
      expect(stories).toHaveLength(1)
      expect(mockClient.get).toHaveBeenCalledWith('/stories', expect.any(Object))
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

      await currentService.listStories({ limit: 500 })
      expect(mockClient.get).toHaveBeenCalledWith('/stories', expect.objectContaining({
        params: expect.objectContaining({ limit: '100' }),
      }))
    })

    it('should filter out invalid story records', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'story-1',
                title: 'Test Story',
                description: 'A test description',
                source: 'Times of India',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                url: 'https://example.com/story-1',
                views: 1000,
                sentiment: 'positive',
              },
              {
                id: 'story-2',
                title: 'Invalid Story',
                description: 'A test description',
                source: 'Times of India',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                url: 'https://example.com/story-2',
                views: 'not_a_number', // invalid type
                sentiment: 'positive',
              },
            ],
            total: 2,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const stories = await currentService.listStories()
      expect(stories).toHaveLength(1)
      expect(stories[0].id).toBe('story-1')
    })

    it('should handle empty story list', async () => {
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

      const stories = await currentService.listStories()
      expect(stories).toEqual([])
    })
  })

  // Story detail tests
  describe('getStoryDetail', () => {
    it('should return single story with full details', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'story-1',
            title: 'Test Story',
            description: 'A test description',
            source: 'Times of India',
            publishedAt: new Date().toISOString(),
            category: 'technology',
            url: 'https://example.com/story-1',
            views: 1000,
            sentiment: 'positive',
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const story = await currentService.getStoryDetail('story-1')
      expect(story.id).toBe('story-1')
      expect(story.title).toBe('Test Story')
      expect(mockClient.get).toHaveBeenCalledWith('/stories/story-1')
    })

    it('should validate story schema', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            id: 'story-1',
            title: 'Test Story',
            description: 'A test description',
            source: 'Times of India',
            publishedAt: new Date().toISOString(),
            category: 'technology',
            url: 'https://example.com/story-1',
            views: 'invalid', // invalid type
            sentiment: 'positive',
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await expect(currentService.getStoryDetail('story-1')).rejects.toThrow()
    })
  })

  // Metrics tests
  describe('getMetrics', () => {
    it('should return dashboard metrics', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            totalStories: 1247,
            freshStories24h: 156,
            lastFetch: new Date().toISOString(),
            healthyProviders: 4,
            degradedProviders: 1,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const metrics = await currentService.getMetrics()
      expect(metrics.totalStories).toBe(1247)
      expect(metrics.freshStories24h).toBe(156)
      expect(metrics.healthyProviders).toBe(4)
    })

    it('should validate metrics schema', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            totalStories: 'invalid', // invalid type
            freshStories24h: 156,
            lastFetch: new Date().toISOString(),
            healthyProviders: 4,
            degradedProviders: 1,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      await expect(currentService.getMetrics()).rejects.toThrow()
    })
  })

  // Health check tests
  describe('checkHealth', () => {
    it('should return true when backend is reachable', async () => {
      vi.mocked(apiClient.checkHealth).mockResolvedValue({ connected: true })

      const healthy = await currentService.checkHealth()
      expect(healthy).toBe(true)
    })

    it('should return false when backend is unreachable', async () => {
      vi.mocked(apiClient.checkHealth).mockResolvedValue({ connected: false })

      const healthy = await currentService.checkHealth()
      expect(healthy).toBe(false)
    })

    it('should handle checkHealth errors gracefully', async () => {
      vi.mocked(apiClient.checkHealth).mockRejectedValue(new Error('Connection failed'))

      const healthy = await currentService.checkHealth()
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
        await currentService.listProviders()
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
        await currentService.listProviders()
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
        await currentService.getStoryDetail('nonexistent')
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
        await currentService.listStories()
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
        await currentService.getMetrics()
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
        await currentService.listProviders()
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
        await currentService.listStories()
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
        await currentService.listProviders()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.code).toBe('SCHEMA_VALIDATION_ERROR')
      }
    })

    it('should include error timestamp', async () => {
      const mockClient = {
        get: vi.fn().mockRejectedValue({
          response: { status: 500 },
          isAxiosError: true,
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      try {
        await currentService.getMetrics()
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.timestamp).toBeDefined()
        expect(typeof error.timestamp).toBe('string')
      }
    })
  })

  // Validation tests
  describe('Sentinel Values and Edge Cases', () => {
    it('should validate invalid sentiment values', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'story-1',
                title: 'Test Story',
                description: 'A test description',
                source: 'Times of India',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                url: 'https://example.com/story-1',
                views: 1000,
                sentiment: 'invalid_sentiment', // invalid
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const stories = await currentService.listStories()
      expect(stories).toHaveLength(0)
    })

    it('should handle malformed ISO dates', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'toi',
                name: 'Times of India',
                status: 'healthy',
                storiesCount: 245,
                lastUpdate: 'not-a-date', // invalid
                errorRate: 0,
              },
            ],
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const providers = await currentService.listProviders()
      expect(providers).toHaveLength(0)
    })

    it('should handle null values in optional fields', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                id: 'story-1',
                title: 'Test Story',
                description: 'A test description',
                source: 'Times of India',
                publishedAt: new Date().toISOString(),
                category: 'technology',
                url: 'https://example.com/story-1',
                views: null, // null instead of number
                sentiment: 'positive',
              },
            ],
            total: 1,
            limit: 50,
            offset: 0,
          },
        }),
      }
      vi.mocked(apiClient.getClient).mockReturnValue(mockClient as any)

      const stories = await currentService.listStories()
      expect(stories).toHaveLength(0)
    })
  })
})
