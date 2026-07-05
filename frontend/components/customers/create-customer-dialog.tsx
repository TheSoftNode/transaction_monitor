"use client"

import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateCustomerMutation } from "@/features/customers/api/customersApi"
import { toast } from "sonner"

interface CreateCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCustomerDialog({ open, onOpenChange }: CreateCustomerDialogProps) {
  const [createCustomer, { isLoading }] = useCreateCustomerMutation()
  const [formData, setFormData] = useState({
    customer_reference: "",
    full_name: "",
    email: "",
    phone: "",
    country_code: "US",
    risk_level: "low" as "low" | "medium" | "high",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCustomer(formData).unwrap()
      toast.success("Customer created successfully!")
      setFormData({
        customer_reference: "",
        full_name: "",
        email: "",
        phone: "",
        country_code: "US",
        risk_level: "low",
      })
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to create customer")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Customer</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new customer profile for monitoring
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference" className="text-slate-300">
                  Customer Reference
                </Label>
                <Input
                  id="reference"
                  value={formData.customer_reference}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_reference: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="CUST-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  Phone (Optional)
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-slate-300">
                  Country Code
                </Label>
                <Input
                  id="country"
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData({ ...formData, country_code: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="US"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk" className="text-slate-300">
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
              {isLoading ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
