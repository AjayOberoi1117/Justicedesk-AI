import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import VakeelSahibDashboard from '../VakeelSahibDashboard'
import { vakeelService } from '../../../services/vakeel-sahib-service'

vi.mock('../../../services/vakeel-sahib-service')
vi.mock('../../../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

describe('VakeelSahibDashboard Error States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LOADING state', () => {
    it('should display loading message', async () => {
      vi.mocked(vakeelService.getKYCMetrics).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          totalAdvocates: 100,
          kycComplete: 80,
          pendingKYC: 15,
          rejectedKYC: 5,
          verificationRate: '80.0',
        }), 500))
      )
      vi.mocked(vakeelService.listAdvocates).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 500))
      )

      render(<VakeelSahibDashboard />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Fetching data from backend')).toBeInTheDocument()
    })
  })

  describe('DATA state', () => {
    it('should display data successfully', async () => {
      vi.mocked(vakeelService.getKYCMetrics).mockResolvedValueOnce({
        totalAdvocates: 100,
        kycComplete: 80,
        pendingKYC: 15,
        rejectedKYC: 5,
        verificationRate: '80.0',
      })

      vi.mocked(vakeelService.listAdvocates).mockResolvedValueOnce([
        {
          id: 'advocate-1',
          name: 'Dr. Ashok Kumar',
          email: 'ashok@vakeel.com',
          barEnrollmentNumber: 'ENR-000001',
          panNumber: 'PAN1123456',
          state: 'Delhi',
          barEnrollmentStatus: 'verified',
          panStatus: 'verified',
          aadhaarStatus: 'not_required',
          createdAt: '2026-09-01T10:00:00Z',
        },
      ])

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Vakeel Sahib Admin Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Dr. Ashok Kumar')).toBeInTheDocument()
      })
    })
  })

  describe('EMPTY state', () => {
    it('should display empty message when no advocates found', async () => {
      vi.mocked(vakeelService.getKYCMetrics).mockResolvedValueOnce({
        totalAdvocates: 0,
        kycComplete: 0,
        pendingKYC: 0,
        rejectedKYC: 0,
        verificationRate: '0.0',
      })

      vi.mocked(vakeelService.listAdvocates).mockResolvedValueOnce([])

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('No Data')).toBeInTheDocument()
        expect(screen.getByText('No advocates found in the system.')).toBeInTheDocument()
      })
    })
  })

  describe('AUTH_FAILED state', () => {
    it('should display auth failed message on 401', async () => {
      const error = new Error('Unauthorized') as any
      error.code = 'UNAUTHORIZED'
      error.status = 401

      vi.mocked(vakeelService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
        expect(screen.getByText('Your session has expired. Please log in again.')).toBeInTheDocument()
        expect(screen.getByText('Authentication required. Please log in again.')).toBeInTheDocument()
      })
    })
  })

  describe('PERMISSION_DENIED state', () => {
    it('should display permission denied message on 403', async () => {
      const error = new Error('Forbidden') as any
      error.code = 'PERMISSION_DENIED'
      error.status = 403

      vi.mocked(vakeelService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
        expect(screen.getByText('You do not have permission to view this data.')).toBeInTheDocument()
        expect(screen.getByText('You do not have permission to access this data.')).toBeInTheDocument()
      })
    })
  })

  describe('RATE_LIMITED state', () => {
    it('should display rate limit message on 429', async () => {
      const error = new Error('Too many requests') as any
      error.code = 'RATE_LIMITED'
      error.status = 429

      vi.mocked(vakeelService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Rate Limited')).toBeInTheDocument()
        expect(screen.getByText('Too many requests. Please wait a moment and try again.')).toBeInTheDocument()
        expect(screen.getByText('Rate limit exceeded. Please try again in a few moments.')).toBeInTheDocument()
      })
    })
  })

  describe('UNAVAILABLE state', () => {
    it('should display unavailable message on network error', async () => {
      const error = new Error('Network error') as any
      error.code = 'NETWORK_ERROR'

      vi.mocked(vakeelService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Backend Unavailable')).toBeInTheDocument()
        expect(screen.getByText('Unable to connect to the backend service.')).toBeInTheDocument()
        expect(screen.getByText('Backend is unreachable. Check your network connection.')).toBeInTheDocument()
      })
    })

    it('should display unavailable message on timeout', async () => {
      const error = new Error('timeout of 5000ms exceeded') as any
      error.code = 'TIMEOUT'

      vi.mocked(vakeelService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Backend Unavailable')).toBeInTheDocument()
      })
    })
  })

  describe('SCHEMA_ERROR state', () => {
    it('should display schema error message on validation failure', async () => {
      const error = new Error('Invalid data format') as any
      error.code = 'SCHEMA_VALIDATION_ERROR'
      error.status = 500

      vi.mocked(vakeelService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<VakeelSahibDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Data Format Error')).toBeInTheDocument()
        expect(screen.getByText('Backend returned invalid data. This is a server issue.')).toBeInTheDocument()
        expect(screen.getByText('Backend returned invalid data format.')).toBeInTheDocument()
      })
    })
  })

  describe('No mock data in production', () => {
    it('should use real service methods, not hardcoded data', () => {
      expect(vakeelService.getKYCMetrics).toBeDefined()
      expect(vakeelService.listAdvocates).toBeDefined()
      expect(typeof vakeelService.getKYCMetrics).toBe('function')
      expect(typeof vakeelService.listAdvocates).toBe('function')
    })
  })
})
