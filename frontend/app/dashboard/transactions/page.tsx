"use client"

import { useState } from "react"
import { Plus, CreditCard, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { TransactionList } from "@/components/transactions/transaction-list"
import { TransactionPagination } from "@/components/transactions/transaction-pagination"
import { CreateTransactionDialog } from "@/components/transactions/create-transaction-dialog"
import { TransactionDetailsDialog } from "@/components/transactions/transaction-details-dialog"
import { useGetTransactionsQuery } from "@/features/transactions/api/transactionsApi"
import type { TransactionListItem } from "@/types"

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionListItem | null>(null)

  const { data, isLoading } = useGetTransactionsQuery({
    page,
    search: search || undefined,
    status: status === "all" ? undefined : status,
    ordering: "-created_at",
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  // Calculate stats
  const stats = data?.results.reduce(
    (acc, t) => {
      acc.total++
      if (t.status === "approved") acc.approved++
      if (t.status === "pending") acc.pending++
      if (t.risk_score >= 70) acc.highRisk++
      return acc
    },
    { total: 0, approved: 0, pending: 0, highRisk: 0 }
  ) || { total: 0, approved: 0, pending: 0, highRisk: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 mt-1">
            Monitor and manage all financial transactions
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data?.count || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Pending Review
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              High Risk
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.highRisk}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <TransactionFilters
            search={search}
            onSearchChange={setSearch}
            status={status}
            onStatusChange={setStatus}
          />
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isLoading ? "Loading..." : `${data?.results.length || 0} Transactions`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TransactionList
            transactions={data?.results}
            isLoading={isLoading}
            onViewDetails={setSelectedTransaction}
          />
          <TransactionPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateTransactionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      />
    </div>
  )
}
