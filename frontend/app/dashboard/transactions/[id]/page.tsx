"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useGetTransactionQuery,
  useUpdateTransactionStatusMutation,
} from "@/features/transactions/api/transactionsApi"
import { useGetAlertsQuery } from "@/features/alerts/api/alertsApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-500/10 text-green-400 border-green-500/20"
    case "rejected":
      return "bg-red-500/10 text-red-400 border-red-500/20"
    case "under_review":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
  }
}

function getRiskColor(score: number) {
  if (score >= 70) return "text-red-400"
  if (score >= 40) return "text-yellow-400"
  return "text-green-400"
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 text-red-400 border-red-500/20"
    case "high":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20"
    case "medium":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20"
  }
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <div className="text-white font-medium">{children}</div>
    </div>
  )
}

export default function TransactionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data: transaction, isLoading, isError } = useGetTransactionQuery(id)
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateTransactionStatusMutation()
  const [newStatus, setNewStatus] = useState<string>("")

  const { data: alertsData } = useGetAlertsQuery(
    { search: transaction?.transaction_reference },
    { skip: !transaction?.transaction_reference }
  )
  const alerts = alertsData?.results ?? []

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error("Please select a status")
      return
    }
    try {
      await updateStatus({ id, status: newStatus }).unwrap()
      toast.success("Transaction status updated successfully!")
      setNewStatus("")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update status")
    }
  }

  const mlPrediction = transaction?.metadata?.ml_prediction as
    | { is_anomaly?: boolean; anomaly_score?: number; warning?: string }
    | undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/transactions")}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Details</h1>
          <p className="text-slate-400 text-sm">
            View and manage a single transaction
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 bg-slate-800" />
          <Skeleton className="h-40 bg-slate-800" />
        </div>
      )}

      {isError && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <p className="text-red-400 font-medium">
              Failed to load transaction.
            </p>
            <Link
              href="/dashboard/transactions"
              className="text-violet-400 hover:underline mt-2 inline-block"
            >
              Back to transactions
            </Link>
          </CardContent>
        </Card>
      )}

      {transaction && (
        <>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Reference</p>
                <CardTitle className="text-xl font-mono text-white">
                  {transaction.transaction_reference}
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cn("capitalize", getStatusColor(transaction.status))}
              >
                {transaction.status.replace("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Field label="Customer">
                {transaction.customer_details?.full_name ?? "—"}
                {transaction.customer_details?.customer_reference && (
                  <span className="block text-xs text-slate-400 font-mono">
                    {transaction.customer_details.customer_reference}
                  </span>
                )}
              </Field>
              <Field label="Amount">
                {transaction.currency}{" "}
                {parseFloat(transaction.amount).toLocaleString()}
              </Field>
              <Field label="Type">
                <span className="capitalize">{transaction.transaction_type}</span>
              </Field>
              <Field label="Risk Score">
                <span
                  className={cn(
                    "font-bold text-lg",
                    getRiskColor(transaction.risk_score)
                  )}
                >
                  {transaction.risk_score}
                </span>
              </Field>
              <Field label="Created At">{formatDate(transaction.created_at)}</Field>
              <Field label="Processed At">
                {formatDate(transaction.processed_at)}
              </Field>
            </CardContent>
          </Card>

          {mlPrediction && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  ML Anomaly Detection
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Field label="Anomaly">
                  {mlPrediction.is_anomaly ? (
                    <span className="text-red-400">Yes</span>
                  ) : (
                    <span className="text-green-400">No</span>
                  )}
                </Field>
                <Field label="Anomaly Score">
                  {(mlPrediction.anomaly_score ?? 0).toFixed(2)}
                </Field>
                {mlPrediction.warning && (
                  <Field label="Note">
                    <span className="text-yellow-400">{mlPrediction.warning}</span>
                  </Field>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related alerts */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Alerts ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  No alerts for this transaction.
                </p>
              ) : (
                <ul className="space-y-3">
                  {alerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-800/40 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
                        <div>
                          <p className="text-white text-sm font-medium">
                            {alert.rule_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(alert.triggered_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "capitalize",
                            getSeverityColor(alert.severity)
                          )}
                        >
                          {alert.severity}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="capitalize text-slate-300 border-slate-600"
                        >
                          {alert.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Update status */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="space-y-2 flex-1">
                  <Label className="text-slate-300">New status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value) => setNewStatus(value || "")}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="pending" className="text-white">
                        Pending
                      </SelectItem>
                      <SelectItem value="approved" className="text-white">
                        Approved
                      </SelectItem>
                      <SelectItem value="rejected" className="text-white">
                        Rejected
                      </SelectItem>
                      <SelectItem value="under_review" className="text-white">
                        Under Review
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isUpdating || !newStatus}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {isUpdating ? "Updating..." : "Update"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
