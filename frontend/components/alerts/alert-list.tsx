"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { AlertListItem } from "@/types"
import { cn } from "@/lib/utils"

interface AlertListProps {
  alerts?: AlertListItem[]
  isLoading: boolean
  onViewDetails: (alert: AlertListItem) => void
}

export function AlertList({ alerts, isLoading, onViewDetails }: AlertListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600/10 text-red-400 border-red-600/20"
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "false_positive":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
      default:
        return "bg-red-500/10 text-red-400 border-red-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 bg-slate-800" />
        ))}
      </div>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No alerts found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
            <TableHead className="text-slate-300">Transaction Ref</TableHead>
            <TableHead className="text-slate-300">Rule</TableHead>
            <TableHead className="text-slate-300">Severity</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Triggered</TableHead>
            <TableHead className="text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow
              key={alert.id}
              className="border-slate-800 hover:bg-slate-800/50"
            >
              <TableCell className="font-mono text-sm text-white">
                {alert.transaction_reference}
              </TableCell>
              <TableCell className="text-white font-medium">
                {alert.rule_name}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", getSeverityColor(alert.severity))}
                >
                  {alert.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusColor(alert.status))}
                >
                  {alert.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                {formatDate(alert.triggered_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(alert)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
