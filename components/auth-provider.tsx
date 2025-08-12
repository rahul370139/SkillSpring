"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loginWithMagicLink: (email: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        const session = data.session
        if (session?.user) {
          const sUser = session.user
          setUser({
            id: sUser.id,
            name: (sUser.user_metadata?.full_name as string) || (sUser.email?.split("@")[0] as string) || "User",
            email: sUser.email || "",
            avatar: (sUser.user_metadata?.avatar_url as string) || undefined,
          })
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Auth init failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const sUser = session.user
        setUser({
          id: sUser.id,
          name: (sUser.user_metadata?.full_name as string) || (sUser.email?.split("@")[0] as string) || "User",
          email: sUser.email || "",
          avatar: (sUser.user_metadata?.avatar_url as string) || undefined,
        })
      } else {
        setUser(null)
      }
    })

    init()
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const loginWithMagicLink = async (email: string) => {
    setIsLoading(true)
    try {
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      })
    } catch (error) {
      console.error("Login with magic link failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setUser(null)
    }
  }

  const value = {
    user,
    loginWithMagicLink,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
