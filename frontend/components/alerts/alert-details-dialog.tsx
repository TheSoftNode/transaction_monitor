"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AlertListItem } from "@/types"
import { useResolveAlertMutation } from "@/features/alerts/api/alertsApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"

interface AlertDetailsDialogProps {
  alert: AlertListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AlertDetailsDialog({
  alert,
  open,
  onOpenChange,
}: AlertDetailsDialogProps) {
  const [resolveAlert, { isLoading }] = useResolveAlertMutation()
  const [resolveStatus, setResolveStatus] = useState<"resolved" | "false_positive" | "">("")

  if (!alert) return null

  const handleResolve = async () => {
    if (!resolveStatus) {
      toast.error("Please select a resolution status")
      return
    }

    try {
      await resolveAlert({
        id: alert.id,
        status: resolveStatus,
      }).unwrap()

      toast.success(`Alert marked as ${resolveStatus.replace("_", " ")}!`)
      setResolveStatus("")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to resolve alert")
    }
  }

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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-5 w-5" />
      case "medium":
        return <Clock className="h-5 w-5" />
      default:
        return <CheckCircle className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-white">Alert Details</DialogTitle>
          <DialogDescription className="text-slate-400">
            Review and manage security alert
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", getSeverityColor(alert.severity))}>
                {getSeverityIcon(alert.severity)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{alert.rule_name}</h3>
                <p className="text-sm font-mono text-slate-400 mt-1">
                  {alert.transaction_reference}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn("capitalize", getStatusColor(alert.status))}
            >
              {alert.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Alert Details */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <p className="text-sm text-slate-400">Severity</p>
              <Badge
                variant="outline"
                className={cn("mt-2 capitalize", getSeverityColor(alert.severity))}
              >
                {alert.severity}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-slate-400">Transaction</p>
              <p className="text-white font-mono mt-2 text-sm">
                {alert.transaction_reference}
              </p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-slate-400">Triggered At</p>
              <p className="text-white mt-2">{formatDate(alert.triggered_at)}</p>
            </div>
          </div>

          {/* Resolve Actions */}
          {alert.status === "active" && (
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <Label className="text-slate-300">Resolve Alert</Label>
              <div className="flex gap-3">
                <Select
                  value={resolveStatus}
                  onValueChange={(value: any) => setResolveStatus(value)}
                >
                  <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="resolved" className="text-white">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span>Resolved</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="false_positive" className="text-white">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-slate-400" />
                        <span>False Positive</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleResolve}
                  disabled={isLoading || !resolveStatus}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isLoading ? "Resolving..." : "Resolve"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
