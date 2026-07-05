"use client"

import { useState } from "react"
import { AlertTriangle, Shield, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertFilters } from "@/components/alerts/alert-filters"
import { AlertList } from "@/components/alerts/alert-list"
import { AlertPagination } from "@/components/alerts/alert-pagination"
import { AlertDetailsDialog } from "@/components/alerts/alert-details-dialog"
import { useGetAlertsQuery } from "@/features/alerts/api/alertsApi"
import type { AlertListItem } from "@/types"

export default function AlertsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("all")
  const [status, setStatus] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState<AlertListItem | null>(null)

  const { data, isLoading } = useGetAlertsQuery({
    page,
    search: search || undefined,
    severity: severity === "all" ? undefined : severity,
    status: status === "all" ? undefined : status,
    ordering: "-triggered_at",
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  // Calculate stats
  const stats = data?.results.reduce(
    (acc, a) => {
      acc.total++
      if (a.status === "active") acc.active++
      if (a.severity === "critical") acc.critical++
      if (a.status === "resolved") acc.resolved++
      return acc
    },
    { total: 0, active: 0, critical: 0, resolved: 0 }
  ) || { total: 0, active: 0, critical: 0, resolved: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Alerts</h1>
          <p className="text-slate-400 mt-1">
            Monitor and investigate security alerts across all transactions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Alerts
            </CardTitle>
            <Shield className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data?.count || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Critical Severity
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Resolved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <AlertFilters
            search={search}
            onSearchChange={setSearch}
            severity={severity}
            onSeverityChange={setSeverity}
            status={status}
            onStatusChange={setStatus}
          />
        </CardContent>
      </Card>

      {/* Alert List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isLoading ? "Loading..." : `${data?.results.length || 0} Alerts`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertList
            alerts={data?.results}
            isLoading={isLoading}
            onViewDetails={setSelectedAlert}
          />
          <AlertPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <AlertDetailsDialog
        alert={selectedAlert}
        open={!!selectedAlert}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      />
    </div>
  )
}
