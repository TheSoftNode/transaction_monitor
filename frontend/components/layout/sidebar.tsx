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
        <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800/50">
          {!collapsed && (
            <Link href="/dashboard/transactions" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">SecureGuard</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-500 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-violet-600/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all hidden lg:flex",
              collapsed && "mx-auto"
            )}
          >
            <ChevronLeft
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                collapsed && "rotate-180"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 mt-2 space-y-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsMobileOpen(false)}>
                <div
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 cursor-pointer",
                    collapsed && "justify-center px-3",
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110")} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.name}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
