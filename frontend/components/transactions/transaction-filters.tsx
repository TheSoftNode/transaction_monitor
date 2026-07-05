"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TransactionFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
}

export function TransactionFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>
      <Select value={status} onValueChange={(value) => onStatusChange(value || "all")}>
        <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="all" className="text-white hover:bg-slate-700">
            All Status
          </SelectItem>
          <SelectItem value="pending" className="text-white hover:bg-slate-700">
            Pending
          </SelectItem>
          <SelectItem value="approved" className="text-white hover:bg-slate-700">
            Approved
          </SelectItem>
          <SelectItem value="rejected" className="text-white hover:bg-slate-700">
            Rejected
          </SelectItem>
          <SelectItem value="under_review" className="text-white hover:bg-slate-700">
            Under Review
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
