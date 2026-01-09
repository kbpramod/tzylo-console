import { Header } from "@/components/Header"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { OnboardingGuard } from "@/components/OnboardingGuard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireVerified>
      <OnboardingGuard>
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6">{children}</main>
    </div>
    </OnboardingGuard>
    </ProtectedRoute>
  )
}
