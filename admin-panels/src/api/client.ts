import axios, { AxiosInstance, AxiosError } from 'axios'
import { ProductMode } from '../types'

interface APIConfig {
  baseURL: string
  timeout: number
  headers?: Record<string, string>
}

const API_CONFIGS: Record<ProductMode, APIConfig> = {
  current: {
    baseURL: process.env.REACT_APP_CURRENT_API_URL || 'http://localhost:3000/api/current',
    timeout: 10000,
  },
  'justice-desk': {
    baseURL: process.env.REACT_APP_JD_API_URL || 'http://localhost:3001/api/justice-desk',
    timeout: 10000,
  },
  'vakeel-sahib': {
    baseURL: process.env.REACT_APP_VS_API_URL || 'http://localhost:3002/api/vakeel-sahib',
    timeout: 10000,
  },
  medideals: {
    baseURL: process.env.REACT_APP_MD_API_URL || 'http://localhost:3003/api/medideals',
    timeout: 10000,
  },
}

class APIClient {
  private clients: Record<ProductMode, AxiosInstance> = {} as any

  constructor() {
    Object.entries(API_CONFIGS).forEach(([product, config]) => {
      this.clients[product as ProductMode] = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      })

      // Add response interceptor for error handling
      this.clients[product as ProductMode].interceptors.response.use(
        response => response,
        error => {
          if (error.response?.status === 401) {
            // Handle unauthorized
            console.error('Unauthorized access')
          }
          return Promise.reject(error)
        }
      )
    })
  }

  getClient(product: ProductMode): AxiosInstance {
    return this.clients[product]
  }

  async checkHealth(product: ProductMode): Promise<{ connected: boolean; error?: string }> {
    try {
      const client = this.getClient(product)
      const response = await client.get('/health', { timeout: 5000 })
      return { connected: response.status === 200 }
    } catch (error) {
      return {
        connected: false,
        error: error instanceof AxiosError ? error.message : 'Unknown error',
      }
    }
  }

  setAuthToken(product: ProductMode, token: string) {
    this.clients[product].defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  clearAuthToken(product: ProductMode) {
    delete this.clients[product].defaults.headers.common['Authorization']
  }
}

export const apiClient = new APIClient()
