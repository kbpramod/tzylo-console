"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/authApi"

export default function VerifyPage() {
  const [error, setError] = useState<string | undefined>()
  const [message, setMessage] = useState<string | undefined>()
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(60)
  const router = useRouter()
  const { identity, loadUser } = useAuth();
 
  const email = identity?.email;

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
      return () => clearInterval(timer)
    }
  }, [cooldown])

  const handleVerify = async () => {
    try {
      await authApi.verifyOtp(email || "", otp);
      await loadUser();
      router.push("/profile");
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    }
  };

  const handleResend = async () => {
    if (!email) return
    try {
      const response = await authApi.sendOtp(email)
      if (response) {
        setCooldown(60)
        setMessage(response.data?.message)
      } else {
        setError("Failed to resend verification. Try again later.")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Resend failed.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <CardDescription>
            We sent a 6-digit code and a verification link to{" "}
            <b>{email || "your email"}</b>. <br />
            Enter the code below or click the link in your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <Button onClick={handleVerify}>Verify with OTP</Button>

          <Button
            onClick={handleResend}
            disabled={cooldown > 0}
            variant="outline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code & Link"}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground text-center">
  Authentication powered by Tzylo Auth CE
</p>
        </CardContent>
      </Card>
    </div>
  )
}
