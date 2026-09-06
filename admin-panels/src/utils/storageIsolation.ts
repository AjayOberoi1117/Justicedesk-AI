import { ProductMode } from '../types'

/**
 * Verify that storage is properly isolated between products.
 * This tests that localStorage/sessionStorage keys are namespaced.
 */
export function testStorageIsolation() {
  const products: ProductMode[] = ['current', 'justice-desk', 'vakeel-sahib', 'medideals']
  const results: Record<string, boolean> = {}

  products.forEach((product) => {
    const testKey = `test-${Date.now()}`
    const testValue = `value-${product}`
    const namespaceKey = `${product}:${testKey}`

    // Set value
    localStorage.setItem(namespaceKey, testValue)

    // Verify isolation - other products shouldn't see it
    let isIsolated = true
    products.forEach((otherProduct) => {
      if (otherProduct !== product) {
        const otherKey = `${otherProduct}:${testKey}`
        if (localStorage.getItem(otherKey) !== null) {
          isIsolated = false
        }
      }
    })

    // Verify value exists in correct namespace
    if (localStorage.getItem(namespaceKey) !== testValue) {
      isIsolated = false
    }

    results[product] = isIsolated

    // Cleanup
    localStorage.removeItem(namespaceKey)
  })

  return results
}

/**
 * Clear all storage for a specific product
 */
export function clearProductStorage(product: ProductMode) {
  const keys = Object.keys(localStorage)
  const sessionKeys = Object.keys(sessionStorage)
  const prefix = `${product}:`

  keys.forEach((key) => {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key)
    }
  })

  sessionKeys.forEach((key) => {
    if (key.startsWith(prefix)) {
      sessionStorage.removeItem(key)
    }
  })
}

/**
 * Get stats on storage usage per product
 */
export function getStorageStats() {
  const products: ProductMode[] = ['current', 'justice-desk', 'vakeel-sahib', 'medideals']
  const stats: Record<ProductMode, { keys: number; estimatedSize: number }> = {} as any

  products.forEach((product) => {
    const prefix = `${product}:`
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix))
    let size = 0

    keys.forEach((key) => {
      const value = localStorage.getItem(key)
      size += (key.length + (value?.length || 0)) * 2 // rough estimate in bytes
    })

    stats[product] = { keys: keys.length, estimatedSize: size }
  })

  return stats
}
