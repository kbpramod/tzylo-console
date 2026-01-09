"use client"

import { useUser } from "@/context/UserContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function OnboardingGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/profile")
    }
  }, [user, isLoading, router])

  if (isLoading) return null

  return <>{children}</>
}
