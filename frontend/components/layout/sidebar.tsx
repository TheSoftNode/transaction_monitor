"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  Users,
  Bell,
  ChevronLeft,
  Shield,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/contexts/sidebar-context"

const navigation = [
  { name: "Transactions", href: "/dashboard/transactions", icon: CreditCard },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
]

export function Sidebar() {
  const { collapsed, setCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 border-r bg-slate-900 border-slate-800 transition-all duration-300",
          // Mobile: slide in/out
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible with width transition
          "lg:translate-x-0",
          collapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <Link href="/dashboard/transactions" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">SecureGuard</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center mx-auto">
              <Shield className="h-5 w-5 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 hidden lg:flex", collapsed && "mx-auto")}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800",
                    collapsed && "justify-center px-2",
                    isActive && "bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
