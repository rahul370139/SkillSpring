'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      // If Supabase sent a code param (PKCE), exchange it for a session
      const code = searchParams.get('code')
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code)
        } catch (err) {
          console.error('Failed to exchange code for session:', err)
        }
      }

      // Whether via code or magic link hash tokens, session should now be set
      // Small delay to allow auth state listener to fire
      setTimeout(() => {
        if (!isMounted) return
        router.replace('/')
      }, 300)
    }

    void handleCallback()
    return () => {
      isMounted = false
    }
  }, [router, searchParams])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
      </div>
    </div>
  )
}


