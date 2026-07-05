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
import type { TransactionListItem } from "@/types"
import { cn } from "@/lib/utils"

interface TransactionListProps {
  transactions?: TransactionListItem[]
  isLoading: boolean
  onViewDetails: (transaction: TransactionListItem) => void
}

export function TransactionList({
  transactions,
  isLoading,
  onViewDetails,
}: TransactionListProps) {
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
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: string, currency: string) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`
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

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No transactions found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
            <TableHead className="text-slate-300">Reference</TableHead>
            <TableHead className="text-slate-300">Customer</TableHead>
            <TableHead className="text-slate-300">Amount</TableHead>
            <TableHead className="text-slate-300">Type</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Risk Score</TableHead>
            <TableHead className="text-slate-300">Date</TableHead>
            <TableHead className="text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="border-slate-800 hover:bg-slate-800/50"
            >
              <TableCell className="font-mono text-sm text-white">
                {transaction.transaction_reference}
              </TableCell>
              <TableCell className="text-white">
                {transaction.customer_name}
              </TableCell>
              <TableCell className="text-white font-medium">
                {formatCurrency(transaction.amount, transaction.currency)}
              </TableCell>
              <TableCell>
                <span className="capitalize text-slate-300">
                  {transaction.transaction_type}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("capitalize", getStatusColor(transaction.status))}>
                  {transaction.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className={cn("font-semibold", getRiskColor(transaction.risk_score))}>
                {transaction.risk_score}
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                {formatDate(transaction.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetails(transaction)}
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
