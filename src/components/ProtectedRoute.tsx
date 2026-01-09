"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({
  children,
  requireVerified = true,
}: {
  children: React.ReactNode
  requireVerified?: boolean
}) {
  const { identity, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!identity) {
      router.replace("/auth/login")
      return
    }

    if (requireVerified && !identity.isVerified) {
      router.replace("/auth/verify")
      return
    }
  }, [identity, isLoading, requireVerified, router])

  if (isLoading) return null

  return <>{children}</>
}
