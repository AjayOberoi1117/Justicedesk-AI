/**
 * Product Isolation Tests
 * Verify that CURRENT, Justice Desk, Vakeel Sahib, and MediDeals
 * maintain complete separation of state and storage
 */

import { useAppStore } from '../store'
import { testStorageIsolation, clearProductStorage, getStorageStats } from '../utils/storageIsolation'

describe('Product Isolation', () => {
  beforeEach(() => {
    // Clear all products' storage before each test
    ;(['current', 'justice-desk', 'vakeel-sahib', 'medideals'] as const).forEach(clearProductStorage)
  })

  test('Storage keys are properly namespaced per product', () => {
    const results = testStorageIsolation()

    Object.entries(results).forEach(([product, isIsolated]) => {
      expect(isIsolated).toBe(true)
    })
  })

  test('Auth state is isolated per product', () => {
    const store = useAppStore.getState()

    // Set product to CURRENT and add user
    store.setProductMode('current')
    store.setUser({
      id: 'user-1',
      email: 'current@example.com',
      name: 'Current User',
      role: 'admin',
      product: 'current',
    })

    const currentAuth = store.authState['current']
    expect(currentAuth.user?.email).toBe('current@example.com')

    // Switch to Justice Desk - should have different auth state
    store.setProductMode('justice-desk')
    const jdAuth = store.authState['justice-desk']
    expect(jdAuth.user).toBeNull()

    // Verify current is still intact
    expect(store.authState['current'].user?.email).toBe('current@example.com')
  })

  test('Backend status is isolated per product', () => {
    const store = useAppStore.getState()

    // Set CURRENT as healthy
    store.setBackendStatus('current', {
      connected: true,
      healthy: true,
      lastChecked: new Date(),
    })

    // Set Justice Desk as unavailable
    store.setBackendStatus('justice-desk', {
      connected: false,
      healthy: false,
      lastChecked: new Date(),
      error: 'Connection failed',
    })

    // Verify isolation
    expect(store.backendStatus['current'].connected).toBe(true)
    expect(store.backendStatus['justice-desk'].connected).toBe(false)
  })

  test('Storage does not leak between products', () => {
    const store = useAppStore.getState()

    store.setProductMode('current')
    const currentKey = store.getStorageKey('test-data')
    localStorage.setItem(currentKey, 'current-value')

    store.setProductMode('justice-desk')
    const jdKey = store.getStorageKey('test-data')
    localStorage.setItem(jdKey, 'jd-value')

    // Verify separation
    expect(localStorage.getItem(currentKey)).toBe('current-value')
    expect(localStorage.getItem(jdKey)).toBe('jd-value')
    expect(currentKey).not.toBe(jdKey)
  })

  test('Storage stats report correct per-product usage', () => {
    // Add test data for each product
    ;(['current', 'justice-desk', 'vakeel-sahib', 'medideals'] as const).forEach((product) => {
      const key = `${product}:test-key`
      localStorage.setItem(key, `test-value-for-${product}`)
    })

    const stats = getStorageStats()

    Object.entries(stats).forEach(([_product, stat]) => {
      expect(stat.keys).toBeGreaterThan(0)
      expect(stat.estimatedSize).toBeGreaterThan(0)
    })
  })

  test('Clearing product storage removes only that product data', () => {
    // Add data for all products
    ;(['current', 'justice-desk', 'vakeel-sahib', 'medideals'] as const).forEach((product) => {
      const key = `${product}:test-key`
      localStorage.setItem(key, `value-${product}`)
    })

    // Clear CURRENT
    clearProductStorage('current')

    // Verify CURRENT is cleared but others remain
    expect(localStorage.getItem('current:test-key')).toBeNull()
    expect(localStorage.getItem('justice-desk:test-key')).not.toBeNull()
    expect(localStorage.getItem('vakeel-sahib:test-key')).not.toBeNull()
    expect(localStorage.getItem('medideals:test-key')).not.toBeNull()
  })

  test('Logout clears product-specific storage', () => {
    const store = useAppStore.getState()

    store.setProductMode('current')
    store.setUser({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      product: 'current',
    })
    localStorage.setItem('current:test-data', 'value')

    // Logout
    store.logout()

    // Verify state is cleared
    expect(store.authState['current'].user).toBeNull()
    expect(localStorage.getItem('current:test-data')).toBeNull()

    // Verify other products are unaffected
    store.setProductMode('justice-desk')
    localStorage.setItem('justice-desk:test-data', 'other-value')
    store.setProductMode('current')
    store.logout()
    expect(localStorage.getItem('justice-desk:test-data')).not.toBeNull()
  })
})
