"use client"

import { Eye, Shield, AlertCircle, Pencil, Trash2 } from "lucide-react"
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
import type { Customer } from "@/types"
import { useDeleteCustomerMutation } from "@/features/customers/api/customersApi"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CustomerListProps {
  customers?: Customer[]
  isLoading: boolean
  onViewDetails: (customer: Customer) => void
  onEdit: (customer: Customer) => void
}

export function CustomerList({ customers, isLoading, onViewDetails, onEdit }: CustomerListProps) {
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()

  const handleDelete = async (customer: Customer) => {
    if (
      !window.confirm(
        `Delete customer "${customer.full_name}" (${customer.customer_reference})? This cannot be undone.`
      )
    ) {
      return
    }
    try {
      await deleteCustomer(customer.id).unwrap()
      toast.success("Customer deleted")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to delete customer")
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      default:
        return "bg-green-500/10 text-green-400 border-green-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No customers found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
            <TableHead className="text-slate-300">Reference</TableHead>
            <TableHead className="text-slate-300">Name</TableHead>
            <TableHead className="text-slate-300">Email</TableHead>
            <TableHead className="text-slate-300">Country</TableHead>
            <TableHead className="text-slate-300">Risk Level</TableHead>
            <TableHead className="text-slate-300">Status</TableHead>
            <TableHead className="text-slate-300">Joined</TableHead>
            <TableHead className="text-slate-300 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="border-slate-800 hover:bg-slate-800/50"
            >
              <TableCell className="font-mono text-sm text-white">
                {customer.customer_reference}
              </TableCell>
              <TableCell className="text-white font-medium">
                {customer.full_name}
              </TableCell>
              <TableCell className="text-slate-300">{customer.email}</TableCell>
              <TableCell className="text-slate-300">{customer.country_code}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", getRiskColor(customer.risk_level))}
                >
                  {customer.risk_level}
                </Badge>
              </TableCell>
              <TableCell>
                {customer.is_blacklisted ? (
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Blacklisted
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                {formatDate(customer.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(customer)}
                    aria-label="View customer"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(customer)}
                    aria-label="Edit customer"
                    className="text-slate-400 hover:text-violet-400 hover:bg-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(customer)}
                    disabled={isDeleting}
                    aria-label="Delete customer"
                    className="text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
