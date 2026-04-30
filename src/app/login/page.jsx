'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
            <div className="h-4 w-4 rounded-sm border-2 border-white"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-black">sendflow</span>
        </div>

        <h1 className="text-2xl font-bold text-black mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-8">Sign in to your account</p>

        {urlError === 'confirmation_failed' && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            Your email is confirmed — the session link expired. Just sign in below.
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-2.5 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          No account?{' '}
          <Link href="/signup" className="text-black font-medium hover:underline">
            Sign up free
          </Link>
        </p>

      </div>
    </div>
  )
}
