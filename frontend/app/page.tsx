"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Shield, TrendingUp, Bell, Users } from "lucide-react"

export default function SplashPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 p-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2"
        >
          <Shield className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">TransactionMonitor</span>
        </motion.div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link href="/auth/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-6xl w-full">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Real-Time Transaction
                <br />
                <span className="text-primary">Monitoring Platform</span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
            >
              Enterprise-grade platform for monitoring financial transactions,
              detecting anomalies, and ensuring compliance with advanced ML-powered
              risk assessment.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8">
                  Start Monitoring
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {[
              {
                icon: Shield,
                title: "Risk Assessment",
                description: "ML-powered anomaly detection and risk scoring",
              },
              {
                icon: TrendingUp,
                title: "Real-Time Monitoring",
                description: "Live transaction tracking and analysis",
              },
              {
                icon: Bell,
                title: "Smart Alerts",
                description: "Rule-based alerting for suspicious activities",
              },
              {
                icon: Users,
                title: "Customer Insights",
                description: "Comprehensive customer profiling and analytics",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>© 2024 TransactionMonitor. Enterprise Transaction Monitoring Platform.</p>
      </footer>
    </div>
  )
}
