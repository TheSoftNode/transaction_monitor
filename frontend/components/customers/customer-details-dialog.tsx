"use client"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Customer } from "@/types"
import { useGetCustomerQuery } from "@/features/customers/api/customersApi"
import { cn } from "@/lib/utils"
import { Shield, AlertCircle, Mail, Phone, MapPin, Calendar } from "lucide-react"

interface CustomerDetailsDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsDialogProps) {
  // The list endpoint returns a partial customer (no phone/updated_at);
  // fetch the full record so all fields render correctly.
  const { data: fullCustomer } = useGetCustomerQuery(customer?.id as string, {
    skip: !customer?.id || !open,
  })

  if (!customer) return null

  const c = fullCustomer ?? customer

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "\u2014"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "\u2014"
    return date.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-white">Customer Details</DialogTitle>
          <DialogDescription className="text-slate-400">
            View customer information and risk profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{c.full_name}</h3>
              <p className="text-sm font-mono text-slate-400 mt-1">
                {c.customer_reference}
              </p>
            </div>
            {c.is_blacklisted ? (
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
          </div>

          {/* Contact Info */}
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-3 text-slate-300">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{c.email}</span>
            </div>
            {c.phone && (
              <div className="flex items-center gap-3 text-slate-300">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{c.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-300">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{c.country_code}</span>
            </div>
          </div>

          {/* Risk & Status */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <p className="text-sm text-slate-400">Risk Level</p>
              <Badge
                variant="outline"
                className={cn("mt-2 capitalize", getRiskColor(c.risk_level))}
              >
                {c.risk_level}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-slate-400">Account Status</p>
              <p className="text-white font-medium mt-2">
                {c.is_blacklisted ? "Blacklisted" : "Active"}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-slate-400">Created</p>
                <p className="text-white">{formatDate(c.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-slate-400">Last Updated</p>
                <p className="text-white">{formatDate(c.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
