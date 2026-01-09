"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { authApi } from "@/lib/authApi"
import { AuthIdentity } from "@/types/auth"

type AuthContextType = {
  identity: AuthIdentity | null
  isAuthenticated: boolean
  isLoading: boolean
  loadUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = async () => {
    try {
      const session = await authApi.me()
      setIdentity(session.user)
    } catch {
      setIdentity(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    await authApi.logout()
    setIdentity(null)
  }

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        identity,
        isAuthenticated: !!identity,
        isLoading,
        loadUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
