"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"

export default function ProfileSetupPage() {
  const { user, refetch } = useUser();
  const [form, setForm] = useState({
    fullName: user?.displayName || "",
    role: "",
    
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  
  useEffect(() => {
    if (!user) return

    setForm((prev) => ({
      ...prev,
      fullName: user.displayName || "",
    }))
  }, [user])


  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setError("")

    if (!form.fullName.trim()) {
      setError("Please enter your name.")
      return
    }

    try {
      setIsLoading(true)

      let response

      if (!user) {
        response = await api.onboarding.create({
          displayName: form.fullName,
        })
      } else {
        response = await api.users.updateProfile({
          displayName: form.fullName,
        })
      }
      await refetch();
      if (response?.data) {
        router.push("/dashboard/flux")
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Tell us a bit more about you to personalize your portfolio experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Input
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
          />

          

          <Select
  value={form.role}
  onValueChange={(val) => handleChange("role", val)}
>
  <SelectTrigger>
    <SelectValue placeholder="Your role (optional)" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="developer">Developer</SelectItem>
    <SelectItem value="founder">Founder</SelectItem>
    <SelectItem value="student">Student</SelectItem>
    <SelectItem value="manager">Engineering Manager</SelectItem>
    <SelectItem value="other">Other</SelectItem>
  </SelectContent>
</Select>

          

          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save & Continue"}
          </Button>
          <p className="text-xs text-muted-foreground">
  Helps us tailor your console experience
</p>
        </CardContent>
      </Card>
    </div>
  )
}
