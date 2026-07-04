import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { RootState } from "@/lib/redux/store"

export function useAuth(requireAuth = true) {
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth)
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && !isAuthenticated && !token) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, token, requireAuth, router])

  return { isAuthenticated, token }
}
