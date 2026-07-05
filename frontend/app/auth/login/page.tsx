"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Eye, EyeOff } from "lucide-react"
import { useLoginMutation, api } from "@/lib/redux/api"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [login, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await login(formData).unwrap()
      localStorage.setItem("access_token", response.access)
      localStorage.setItem("refresh_token", response.refresh)

      // Fetch user profile after login
      const userResponse = await fetch(`/api/v1/auth/user/`, {
        headers: {
          Authorization: `Bearer ${response.access}`,
        },
      })

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user profile")
      }

      const userData = await userResponse.json()
      localStorage.setItem("user_data", JSON.stringify({
        username: userData.username,
        email: userData.email,
      }))

      toast.success("Login successful!")
      window.location.href = "/dashboard/transactions"
    } catch (error: any) {
      toast.error(error?.data?.detail || "Login failed. Please check your credentials.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SecureGuard</span>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome back</h1>
          <p className="text-slate-400 text-center mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Email or Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Enter your email or username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-violet-400 hover:text-violet-300">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
