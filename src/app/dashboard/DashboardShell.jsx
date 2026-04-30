'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardShell({ children }) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* SIDEBAR */}
      <aside className="w-64 border-r bg-white p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-7 w-7 rounded-lg bg-black flex items-center justify-center">
            <div className="h-3.5 w-3.5 rounded-sm border-2 border-white"></div>
          </div>
          <span className="text-lg font-bold tracking-tight text-black">sendflow</span>
        </div>

        <nav className="flex flex-col gap-1 text-sm flex-1">
          <a href="/dashboard" className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
            Dashboard
          </a>
          <a href="/dashboard/campaigns" className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
            Campaigns
          </a>
          <a href="/dashboard/settings" className="px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-black transition-colors">
            Settings
          </a>
        </nav>

        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-black transition-colors text-left"
        >
          Sign out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}
