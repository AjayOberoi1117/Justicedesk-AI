import { create } from 'zustand'
import { ProductMode, User, AuthState, BackendStatus } from './types'

interface AppStore {
  // Product mode - must be set at app start
  productMode: ProductMode | null
  setProductMode: (mode: ProductMode) => void

  // Auth state - isolated per product
  authState: Record<ProductMode, AuthState>
  setUser: (user: User | null) => void
  setAuthLoading: (loading: boolean) => void
  setAuthError: (error: string | null) => void
  logout: () => void

  // Backend status - isolated per product
  backendStatus: Record<ProductMode, BackendStatus>
  setBackendStatus: (product: ProductMode, status: BackendStatus) => void

  // Storage namespace isolation
  getStorageKey: (key: string) => string
  getSessionStorageKey: (key: string) => string
  clearProductStorage: (product: ProductMode) => void
}

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const initialBackendStatus: BackendStatus = {
  connected: false,
  healthy: false,
  lastChecked: new Date(),
}

export const useAppStore = create<AppStore>((set, get) => ({
  productMode: null,
  setProductMode: (mode: ProductMode) => set({ productMode: mode }),

  authState: {
    current: { ...initialAuthState },
    'justice-desk': { ...initialAuthState },
    'vakeel-sahib': { ...initialAuthState },
    medideals: { ...initialAuthState },
  },

  setUser: (user: User | null) => set((state) => {
    if (!state.productMode) return state
    return {
      authState: {
        ...state.authState,
        [state.productMode]: {
          ...state.authState[state.productMode],
          user,
          isAuthenticated: !!user,
          error: null,
        },
      },
    }
  }),

  setAuthLoading: (loading: boolean) => set((state) => {
    if (!state.productMode) return state
    return {
      authState: {
        ...state.authState,
        [state.productMode]: {
          ...state.authState[state.productMode],
          isLoading: loading,
        },
      },
    }
  }),

  setAuthError: (error: string | null) => set((state) => {
    if (!state.productMode) return state
    return {
      authState: {
        ...state.authState,
        [state.productMode]: {
          ...state.authState[state.productMode],
          error,
        },
      },
    }
  }),

  logout: () => set((state) => {
    if (!state.productMode) return state
    // Clear product-specific storage when logging out
    get().clearProductStorage(state.productMode)
    return {
      authState: {
        ...state.authState,
        [state.productMode]: { ...initialAuthState },
      },
    }
  }),

  backendStatus: {
    current: { ...initialBackendStatus },
    'justice-desk': { ...initialBackendStatus },
    'vakeel-sahib': { ...initialBackendStatus },
    medideals: { ...initialBackendStatus },
  },

  setBackendStatus: (product: ProductMode, status: BackendStatus) => set((state) => ({
    backendStatus: {
      ...state.backendStatus,
      [product]: status,
    },
  })),

  getStorageKey: (key: string) => {
    const state = get()
    if (!state.productMode) throw new Error('Product mode not set')
    return `${state.productMode}:${key}`
  },

  getSessionStorageKey: (key: string) => {
    const state = get()
    if (!state.productMode) throw new Error('Product mode not set')
    return `${state.productMode}:session:${key}`
  },

  clearProductStorage: (product: ProductMode) => {
    const keys = Object.keys(localStorage)
    const prefix = `${product}:`
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key)
      }
    })

    const sessionKeys = Object.keys(sessionStorage)
    const sessionPrefix = `${product}:session:`
    sessionKeys.forEach(key => {
      if (key.startsWith(sessionPrefix)) {
        sessionStorage.removeItem(key)
      }
    })
  },
}))

// Ensure product mode is set before any other state is accessed
export const ensureProductMode = () => {
  const state = useAppStore.getState()
  if (!state.productMode) {
    throw new Error('Product mode must be set before accessing store')
  }
  return state.productMode
}
