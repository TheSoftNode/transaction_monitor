"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useGetAlertsQuery,
  useGetAlertQuery,
  useResolveAlertMutation,
} from "@/features/alerts/api/alertsApi"

export default function AlertsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

  const { data, isLoading, isFetching } = useGetAlertsQuery({
    page,
    search: search || undefined,
    severity: severity || undefined,
    status: status || undefined,
  })

  const { data: selectedAlert } = useGetAlertQuery(selectedAlertId!, {
    skip: !selectedAlertId,
  })

  const [resolveAlert, { isLoading: isResolving }] = useResolveAlertMutation()

  const getSeverityColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-destructive text-destructive-foreground border-destructive"
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "medium":
        return "bg-secondary/10 text-secondary border-secondary/20"
      case "low":
        return "bg-accent/10 text-accent border-accent/20"
      default:
        return "bg-muted"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "resolved":
        return "bg-accent/10 text-accent border-accent/20"
      case "false_positive":
        return "bg-muted/10 text-muted-foreground border-muted/20"
      default:
        return "bg-muted"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleResolve = async (
    alertId: string,
    newStatus: "resolved" | "false_positive"
  ) => {
    try {
      await resolveAlert({ id: alertId, status: newStatus }).unwrap()
      setSelectedAlertId(null)
    } catch (error) {
      console.error("Failed to resolve alert:", error)
    }
  }

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage security alerts
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by rule name or transaction reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={severity}
              onValueChange={(value) => setSeverity(value || "")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value || "")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {data?.count || 0} Alert{data?.count !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No alerts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.results.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-mono text-sm">
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/transactions?ref=${alert.transaction_reference}`
                            )
                          }
                          className="text-primary hover:underline"
                        >
                          {alert.transaction_reference}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {alert.rule_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getSeverityColor(alert.severity)}
                        >
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(alert.status)}
                        >
                          {alert.status === "false_positive"
                            ? "False Positive"
                            : alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(alert.triggered_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAlertId(alert.id)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to{" "}
                {Math.min(page * 20, data.count)} of {data.count} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(page - 1)}
                  disabled={!data.previous}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(page + 1)}
                  disabled={!data.next}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlertId} onOpenChange={() => setSelectedAlertId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>
              Review and manage this security alert
            </DialogDescription>
          </DialogHeader>

          {selectedAlert ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rule Name</p>
                  <p className="font-medium">{selectedAlert.rule_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <Badge
                    variant="outline"
                    className={getSeverityColor(selectedAlert.severity)}
                  >
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={getStatusColor(selectedAlert.status)}
                  >
                    {selectedAlert.status === "false_positive"
                      ? "False Positive"
                      : selectedAlert.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction</p>
                  <button
                    onClick={() => {
                      setSelectedAlertId(null)
                      router.push(
                        `/dashboard/transactions?ref=${selectedAlert.transaction_details?.transaction_reference}`
                      )
                    }}
                    className="font-mono text-sm text-primary hover:underline"
                  >
                    {selectedAlert.transaction_details?.transaction_reference}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="mt-1">{selectedAlert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Triggered At</p>
                  <p className="text-sm">{formatDate(selectedAlert.triggered_at)}</p>
                </div>
                {selectedAlert.resolved_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Resolved At</p>
                    <p className="text-sm">{formatDate(selectedAlert.resolved_at)}</p>
                  </div>
                )}
              </div>

              {selectedAlert.resolved_by_username && (
                <div>
                  <p className="text-sm text-muted-foreground">Resolved By</p>
                  <p className="text-sm">{selectedAlert.resolved_by_username}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          <DialogFooter>
            {selectedAlert?.status === "active" && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    handleResolve(selectedAlert.id, "false_positive")
                  }
                  disabled={isResolving}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark False Positive
                </Button>
                <Button
                  onClick={() => handleResolve(selectedAlert.id, "resolved")}
                  disabled={isResolving}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Resolve Alert
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
