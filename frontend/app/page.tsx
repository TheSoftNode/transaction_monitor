"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ArrowRight, Github } from "lucide-react"
import { DashboardPreview } from "@/components/dashboard-preview"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { useAuth } from "@/hooks/useAuth"

export default function SplashPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SecureGuard</span>
            </motion.div>
          </Link>
          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <ProfileDropdown user={user} onLogout={logout} />
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost" className="text-slate-300 hover:text-white">Sign In</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative h-screen overflow-hidden">
        <div className="h-full grid lg:grid-cols-2 gap-12 items-center">
          <div className="container mx-auto px-6 pt-20 lg:pt-0">
            <div className="max-w-xl mx-auto lg:mx-0 lg:ml-auto text-center lg:text-left">
              {/* Left Content */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                    Detect fraud{" "}
                    <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                      before it happens
                    </span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-slate-400 leading-relaxed"
                >
                  AI-powered transaction monitoring that analyzes every payment in real-time, flags suspicious activity, and protects your business from fraud.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-3 text-xs text-slate-400 justify-center lg:justify-start"
                >
                  <span>✓ Real-time monitoring</span>
                  <span>✓ Smart alerts</span>
                  <span>✓ Risk scoring</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
                >
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard/transactions">
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white px-6 w-full sm:w-auto">
                          Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <a
                        href="https://github.com/TheSoftNode/transaction_monitor"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 px-6 w-full sm:w-auto">
                          <Github className="mr-2 h-4 w-4" /> GitHub
                        </Button>
                      </a>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/register">
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white px-6 w-full sm:w-auto">
                          Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/auth/login">
                        <Button variant="outline" className="text-slate-300 border-slate-700 hover:bg-slate-800 px-6 w-full sm:w-auto">
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hidden lg:flex items-center justify-center px-6">
            <DashboardPreview />
          </div>
        </div>
      </main>
    </div>
  )
}
