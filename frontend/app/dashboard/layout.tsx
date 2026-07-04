"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import type { RootState } from "@/lib/redux/store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { token } = useSelector((state: RootState) => state.auth)
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.push("/auth/login")
    }
  }, [token, router])

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
