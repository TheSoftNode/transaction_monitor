"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Eye, EyeOff } from "lucide-react"
import { useRegisterMutation } from "@/lib/redux/api"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const [register, { isLoading }] = useRegisterMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirm) {
      toast.error("Passwords do not match")
      return
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password2: formData.password_confirm,
      }).unwrap()

      toast.success("Account created successfully! Please sign in.")
      window.location.href = "/auth/login"
    } catch (error: any) {
      const errorMsg = error?.data?.username?.[0] ||
                      error?.data?.email?.[0] ||
                      error?.data?.password?.[0] ||
                      error?.data?.first_name?.[0] ||
                      error?.data?.last_name?.[0] ||
                      "Registration failed. Please try again."
      toast.error(errorMsg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SecureGuard</span>
          </div>

          <h1 className="text-xl font-bold text-white text-center mb-1">Create your account</h1>
          <p className="text-slate-400 text-center text-sm mb-6">Get started with your free trial</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="first_name" className="text-slate-300 text-sm">First Name</Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-9"
                  placeholder="First name"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="last_name" className="text-slate-300 text-sm">Last Name</Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-9"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-slate-300 text-sm">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white h-9"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white h-9"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-9 pr-10"
                  placeholder="Create a password"
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

            <div className="space-y-1.5">
              <Label htmlFor="password_confirm" className="text-slate-300 text-sm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="password_confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.password_confirm}
                  onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white h-9 pr-10"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-9"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-violet-400 hover:text-violet-300">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center">
            <Link href="/" className="text-slate-500 hover:text-slate-400 text-sm">
              ← Back to home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
