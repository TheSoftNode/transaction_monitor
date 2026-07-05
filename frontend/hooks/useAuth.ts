"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  username: string
  email: string
}

export function useAuth(requireAuth = false) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("access_token")
      const userData = localStorage.getItem("user_data")

      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
        if (requireAuth) {
          router.push("/auth/login")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [requireAuth, router])

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user_data")
    setUser(null)
    window.location.href = "/"
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
  }
}
