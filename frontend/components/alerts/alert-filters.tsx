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

interface AlertFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  severity: string
  onSeverityChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
}

export function AlertFilters({
  search,
  onSearchChange,
  severity,
  onSeverityChange,
  status,
  onStatusChange,
}: AlertFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search alerts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
        />
      </div>
      <Select value={severity} onValueChange={(value) => onSeverityChange(value || "all")}>
        <SelectTrigger className="w-full sm:w-[160px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="all" className="text-white">All Severity</SelectItem>
          <SelectItem value="low" className="text-white">Low</SelectItem>
          <SelectItem value="medium" className="text-white">Medium</SelectItem>
          <SelectItem value="high" className="text-white">High</SelectItem>
          <SelectItem value="critical" className="text-white">Critical</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={(value) => onStatusChange(value || "all")}>
        <SelectTrigger className="w-full sm:w-[160px] bg-slate-800 border-slate-700 text-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="all" className="text-white">All Status</SelectItem>
          <SelectItem value="active" className="text-white">Active</SelectItem>
          <SelectItem value="resolved" className="text-white">Resolved</SelectItem>
          <SelectItem value="false_positive" className="text-white">False Positive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
