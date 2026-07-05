"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LayoutDashboard, LogOut } from "lucide-react"

interface ProfileDropdownProps {
  user: {
    username: string
    email: string
  }
  onLogout: () => void
}

export function ProfileDropdown({ user, onLogout }: ProfileDropdownProps) {
  const initials = user.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-9 w-9 border-2 border-violet-500 cursor-pointer hover:border-violet-400 transition-colors">
          <AvatarFallback className="bg-violet-600 text-white font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
        <div className="px-2 py-1.5 text-sm">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">{user.username}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="bg-slate-800" />
        <Link href="/dashboard/transactions">
          <DropdownMenuItem className="text-slate-300 focus:bg-slate-800 focus:text-white cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-red-400 focus:bg-slate-800 focus:text-red-300 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
