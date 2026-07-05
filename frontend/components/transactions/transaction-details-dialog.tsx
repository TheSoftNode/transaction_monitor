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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { TransactionListItem } from "@/types"
import { useUpdateTransactionStatusMutation } from "@/features/transactions/api/transactionsApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface TransactionDetailsDialogProps {
  transaction: TransactionListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailsDialogProps) {
  const [updateStatus, { isLoading }] = useUpdateTransactionStatusMutation()
  const [newStatus, setNewStatus] = useState<string>("")

  if (!transaction) return null

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error("Please select a status")
      return
    }

    try {
      await updateStatus({
        id: transaction.id,
        status: newStatus,
      }).unwrap()

      toast.success("Transaction status updated successfully!")
      setNewStatus("")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update status")
    }
  }

  const getStatusColor = (status: string) => {
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

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-400"
    if (score >= 40) return "text-yellow-400"
    return "text-green-400"
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
          <DialogTitle className="text-white">Transaction Details</DialogTitle>
          <DialogDescription className="text-slate-400">
            View and manage transaction information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reference & Status */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-400">Reference</p>
              <p className="text-lg font-mono font-semibold text-white">
                {transaction.transaction_reference}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("capitalize", getStatusColor(transaction.status))}
            >
              {transaction.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Customer</p>
              <p className="text-white font-medium">{transaction.customer_name}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Amount</p>
              <p className="text-white font-semibold">
                {transaction.currency}{" "}
                {parseFloat(transaction.amount).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Type</p>
              <p className="text-white capitalize">{transaction.transaction_type}</p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Risk Score</p>
              <p className={cn("font-bold text-lg", getRiskColor(transaction.risk_score))}>
                {transaction.risk_score}
              </p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-slate-400">Created At</p>
              <p className="text-white">{formatDate(transaction.created_at)}</p>
            </div>
          </div>

          {/* Update Status */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <Label className="text-slate-300">Update Status</Label>
            <div className="flex gap-3">
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value || "")}>
                <SelectTrigger className="flex-1 bg-slate-800 border-slate-700 text-white">
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
              <Button
                onClick={handleStatusUpdate}
                disabled={isLoading || !newStatus}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
