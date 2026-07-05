"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CustomerFiltersProps {
  search: string
  onSearchChange: (value: string) => void
}

export function CustomerFilters({ search, onSearchChange }: CustomerFiltersProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        placeholder="Search customers by name, email, or reference..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
      />
    </div>
  )
}
