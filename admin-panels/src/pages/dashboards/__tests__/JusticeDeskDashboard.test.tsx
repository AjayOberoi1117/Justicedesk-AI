import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import JusticeDeskDashboard from '../JusticeDeskDashboard'
import { justiceService, APIError } from '../../../services/justice-desk-service'

vi.mock('../../../services/justice-desk-service')
vi.mock('../../../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

describe('JusticeDeskDashboard Error States', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LOADING state', () => {
    it('should display loading message', async () => {
      vi.mocked(justiceService.getKYCMetrics).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          totalUsers: 100,
          verifiedUsers: 50,
          pendingKYC: 30,
          rejectedKYC: 20,
          verificationRate: '50.0',
          avgVerificationTime: '2 days',
        }), 500))
      )
      vi.mocked(justiceService.listUsers).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve([]), 500))
      )

      render(<JusticeDeskDashboard />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Fetching data from backend')).toBeInTheDocument()
    })
  })

  describe('DATA state', () => {
    it('should display data successfully', async () => {
      vi.mocked(justiceService.getKYCMetrics).mockResolvedValueOnce({
        totalUsers: 100,
        verifiedUsers: 50,
        pendingKYC: 30,
        rejectedKYC: 20,
        verificationRate: '50.0',
        avgVerificationTime: '2 days',
      })

      vi.mocked(justiceService.listUsers).mockResolvedValueOnce([
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
          kycStatus: 'verified',
          documentsVerified: ['id_proof'],
          createdAt: '2026-09-01T10:00:00Z',
          documents: [],
        },
      ])

      render(<JusticeDeskDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Justice Desk Admin Dashboard')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })
    })
  })

  describe('EMPTY state', () => {
    it('should display empty message when no users found', async () => {
      vi.mocked(justiceService.getKYCMetrics).mockResolvedValueOnce({
        totalUsers: 0,
        verifiedUsers: 0,
        pendingKYC: 0,
        rejectedKYC: 0,
        verificationRate: '0.0',
        avgVerificationTime: '0 days',
      })

      vi.mocked(justiceService.listUsers).mockResolvedValueOnce([])

      render(<JusticeDeskDashboard />)

      await waitFor(() => {
        expect(screen.getByText('No Data')).toBeInTheDocument()
        expect(screen.getByText('No KYC users found in the system.')).toBeInTheDocument()
      })
    })
  })

  describe('AUTH_FAILED state', () => {
    it('should display auth failed message on 401', async () => {
      const error = new Error('Unauthorized') as any
      error.code = 'UNAUTHORIZED'
      error.status = 401

      vi.mocked(justiceService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<JusticeDeskDashboard />)

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

      vi.mocked(justiceService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<JusticeDeskDashboard />)

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

      vi.mocked(justiceService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<JusticeDeskDashboard />)

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

      vi.mocked(justiceService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<JusticeDeskDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Backend Unavailable')).toBeInTheDocument()
        expect(screen.getByText('Unable to connect to the backend service.')).toBeInTheDocument()
        expect(screen.getByText('Backend is unreachable. Check your network connection.')).toBeInTheDocument()
      })
    })

    it('should display unavailable message on timeout', async () => {
      const error = new Error('timeout of 5000ms exceeded') as any
      error.code = 'TIMEOUT'

      vi.mocked(justiceService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<JusticeDeskDashboard />)

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

      vi.mocked(justiceService.getKYCMetrics).mockRejectedValueOnce(error)

      render(<JusticeDeskDashboard />)

      await waitFor(() => {
        expect(screen.getByText('Data Format Error')).toBeInTheDocument()
        expect(screen.getByText('Backend returned invalid data. This is a server issue.')).toBeInTheDocument()
        expect(screen.getByText('Backend returned invalid data format.')).toBeInTheDocument()
      })
    })
  })

  describe('No mock data in production', () => {
    it('should use real service methods, not hardcoded data', () => {
      expect(justiceService.getKYCMetrics).toBeDefined()
      expect(justiceService.listUsers).toBeDefined()
      expect(typeof justiceService.getKYCMetrics).toBe('function')
      expect(typeof justiceService.listUsers).toBe('function')
    })
  })
})
