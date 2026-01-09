"use client"

import { useState } from "react"
import Link from "next/link"
import { authApi } from "@/lib/authApi"
import { useRouter } from "next/navigation"

export function Header() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      setOpen(false)
      router.push("/")
      router.refresh()
    }
  }


  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-white">
      <Link
        href="/dashboard/flux"
        className="text-lg font-semibold"
      >
        Tzylo Console
      </Link>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
        >
          <span className="text-sm font-medium">P</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-40 border rounded-md bg-white shadow-sm">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm hover:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
