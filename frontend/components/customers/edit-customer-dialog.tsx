"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateCustomerMutation } from "@/features/customers/api/customersApi"
import type { Customer } from "@/types"
import { toast } from "sonner"

interface EditCustomerDialogProps {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: EditCustomerDialogProps) {
  const [updateCustomer, { isLoading }] = useUpdateCustomerMutation()
  const [formData, setFormData] = useState({
    customer_reference: "",
    full_name: "",
    email: "",
    phone: "",
    country_code: "US",
    risk_level: "low" as "low" | "medium" | "high",
    is_blacklisted: false,
  })

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_reference: customer.customer_reference,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone || "",
        country_code: customer.country_code,
        risk_level: customer.risk_level,
        is_blacklisted: customer.is_blacklisted,
      })
    }
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return
    try {
      await updateCustomer({ id: customer.id, data: formData }).unwrap()
      toast.success("Customer updated successfully!")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update customer")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Customer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update this customer&apos;s profile
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-reference" className="text-slate-300">
                  Customer Reference
                </Label>
                <Input
                  id="edit-reference"
                  value={formData.customer_reference}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_reference: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-slate-300">
                Email Address
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-slate-300">
                  Phone (Optional)
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-country" className="text-slate-300">
                  Country Code
                </Label>
                <Input
                  id="edit-country"
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData({ ...formData, country_code: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-risk" className="text-slate-300">
                Risk Level
              </Label>
              <Select
                value={formData.risk_level}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, risk_level: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="low" className="text-white">
                    Low Risk
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    Medium Risk
                  </SelectItem>
                  <SelectItem value="high" className="text-white">
                    High Risk
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="edit-blacklisted"
                checked={formData.is_blacklisted}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_blacklisted: checked === true })
                }
              />
              <Label htmlFor="edit-blacklisted" className="text-slate-300">
                Blacklisted
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
