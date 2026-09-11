export type ProductMode = 'current' | 'justice-desk' | 'vakeel-sahib' | 'medideals'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'operator' | 'viewer'
  product: ProductMode
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface BackendStatus {
  connected: boolean
  healthy: boolean
  lastChecked: Date
  error?: string
}

export interface DataState {
  status: BackendStatus
  isLoading: boolean
  error: string | null
  timestamp: Date
}

// CURRENT Product Types
export interface CurrentMetrics {
  totalStories: number
  freshStories24h: number
  providerStatus: Record<string, 'healthy' | 'degraded' | 'unavailable'>
  feedStatus: Record<string, 'active' | 'paused' | 'error'>
}

// Justice Desk Types
export interface JDUser {
  id: string
  name: string
  email: string
  kycStatus: 'pending' | 'verified' | 'rejected' | 'submitted'
  documentsVerified: string[]
  createdAt: Date
}

// Vakeel Sahib Types
export interface VSAdvocate {
  id: string
  name: string
  email: string
  barEnrollmentStatus: 'pending' | 'verified' | 'rejected'
  panStatus: 'pending' | 'verified' | 'rejected'
  aadhaarStatus?: 'pending' | 'verified' | 'rejected'
  createdAt: Date
}

// MediDeals Types
export interface MDUser {
  id: string
  name: string
  company: string
  role: 'retailer' | 'distributor' | 'vendor'
  kycStatus: 'pending' | 'verified' | 'rejected'
  documents: Record<string, 'submitted' | 'verified' | 'rejected' | 'not_required'>
  createdAt: Date
}

export interface MDProduct {
  id: string
  name: string
  category: string
  seller: string
  price: number
  quantity: number
}

export interface MDOrder {
  id: string
  buyer: string
  items: MDProduct[]
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  createdAt: Date
}
