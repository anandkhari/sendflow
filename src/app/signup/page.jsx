'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Supabase returns no error for existing emails — detectable via empty identities
    if (data?.user?.identities?.length === 0) {
      setError('An account with this email already exists. Sign in instead.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center gap-2 mb-10 justify-center">
            <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
              <div className="h-4 w-4 rounded-sm border-2 border-white"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-black">sendflow</span>
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Check your email</h1>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to <span className="font-medium text-black">{email}</span>. Click it to activate your account.
          </p>
          <Link href="/login" className="mt-8 inline-block text-sm text-gray-500 hover:text-black transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    )
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

        <h1 className="text-2xl font-bold text-black mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-8">Start sending smarter cold emails</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-medium hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
