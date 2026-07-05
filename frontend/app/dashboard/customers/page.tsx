"use client"

import { useState } from "react"
import { Plus, Users, Shield, AlertTriangle, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomerFilters } from "@/components/customers/customer-filters"
import { CustomerList } from "@/components/customers/customer-list"
import { CustomerPagination } from "@/components/customers/customer-pagination"
import { CreateCustomerDialog } from "@/components/customers/create-customer-dialog"
import { CustomerDetailsDialog } from "@/components/customers/customer-details-dialog"
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog"
import { useGetCustomersQuery } from "@/features/customers/api/customersApi"
import type { Customer } from "@/types"

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const { data, isLoading } = useGetCustomersQuery({
    page,
    search: search || undefined,
  })

  const totalPages = data ? Math.ceil(data.count / 20) : 0

  // Calculate stats
  const stats = data?.results.reduce(
    (acc, c) => {
      acc.total++
      if (c.risk_level === "high") acc.highRisk++
      if (c.risk_level === "low") acc.lowRisk++
      if (c.is_blacklisted) acc.blacklisted++
      return acc
    },
    { total: 0, highRisk: 0, lowRisk: 0, blacklisted: 0 }
  ) || { total: 0, highRisk: 0, lowRisk: 0, blacklisted: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 mt-1">
            Manage customer profiles and risk assessments
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data?.count || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Low Risk
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.lowRisk}</div>
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

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Blacklisted
            </CardTitle>
            <Shield className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.blacklisted}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <CustomerFilters search={search} onSearchChange={setSearch} />
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isLoading ? "Loading..." : `${data?.results.length || 0} Customers`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CustomerList
            customers={data?.results}
            isLoading={isLoading}
            onViewDetails={setSelectedCustomer}
            onEdit={setEditingCustomer}
          />
          <CustomerPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateCustomerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <CustomerDetailsDialog
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
      />
      <EditCustomerDialog
        customer={editingCustomer}
        open={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
      />
    </div>
  )
}
