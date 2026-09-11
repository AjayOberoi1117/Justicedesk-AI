import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

export default function LoginPage() {
  const navigate = useNavigate()
  const productMode = useAppStore(s => s.productMode)
  const setUser = useAppStore(s => s.setUser)
  const setAuthLoading = useAppStore(s => s.setAuthLoading)
  const setAuthError = useAppStore(s => s.setAuthError)
  const authState = useAppStore(s => s.authState[s.productMode!])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!productMode) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthLoading(true)

    try {
      // TODO: Connect to real authentication backend
      // For now, accept any non-empty credentials
      if (!email || !password) {
        throw new Error('Email and password are required')
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      setUser({
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role: 'admin',
        product: productMode,
      })

      navigate('/')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600 mb-8">Product: {productMode}</p>

        <form onSubmit={handleLogin} className="space-y-6">
          {authState?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{authState.error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={authState?.isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={authState?.isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={authState?.isLoading}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {authState?.isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Demo Mode:</strong> Use any email and password to login.
          </p>
        </div>
      </div>
    </div>
  )
}
