"use client"

import { ProtectedRoute } from "@/components/ProtectedRoute"

export default function VerifyLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireVerified={false}>
      {children}
    </ProtectedRoute>
  )
}
