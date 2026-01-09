"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import api from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type User = {
  id: string
  email: string
  displayName: string | null
  avatarUrl?: string | null
}

type UserContextType = {
  user: User | null
  isLoading: boolean
  refetch: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(
  undefined
)

export function UserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const res = await api.users.me()
      setUser(res.data.user)
    } catch (err: any) {
      if (err.response?.status === 404) {
        setUser(null)
      } else {
        console.error("Failed to fetch user", err)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser()
    } else {
      setUser(null)
      setIsLoading(false)
    }
  }, [isAuthenticated])

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        refetch: fetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}
