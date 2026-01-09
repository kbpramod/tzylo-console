"use client"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Header } from "@/components/Header"

export default function ProfileLayout({ children }: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireVerified>
      <Header />
      {children}
    </ProtectedRoute>
  )
}
