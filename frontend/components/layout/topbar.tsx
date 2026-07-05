"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, Menu } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useSidebar } from "@/contexts/sidebar-context"
import { toast } from "sonner"

export function Topbar() {
  const { user, logout } = useAuth()
  const { setIsMobileOpen } = useSidebar()

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
  }

  const initials = user?.username
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-800 bg-slate-900 px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <Avatar className="h-9 w-9 border-2 border-violet-500">
            <AvatarFallback className="bg-violet-600 text-white font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-white">{user?.username}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
