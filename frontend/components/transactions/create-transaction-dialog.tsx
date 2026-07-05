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
import { useCreateTransactionMutation } from "@/features/transactions/api/transactionsApi"
import { toast } from "sonner"

interface CreateTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTransactionDialog({
  open,
  onOpenChange,
}: CreateTransactionDialogProps) {
  const [createTransaction, { isLoading }] = useCreateTransactionMutation()
  const [formData, setFormData] = useState({
    customer_reference: "",
    amount: "",
    currency: "USD",
    transaction_type: "deposit" as "deposit" | "withdrawal" | "transfer",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTransaction({
        customer: formData.customer_reference,
        amount: formData.amount,
        currency: formData.currency,
        transaction_type: formData.transaction_type,
      }).unwrap()

      toast.success("Transaction created successfully!")
      setFormData({
        customer_reference: "",
        amount: "",
        currency: "USD",
        transaction_type: "deposit",
      })
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to create transaction")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Create Transaction</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new transaction for monitoring
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-slate-300">
                Customer Reference
              </Label>
              <Input
                id="customer"
                value={formData.customer_reference}
                onChange={(e) =>
                  setFormData({ ...formData, customer_reference: e.target.value })
                }
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="e.g., CUST-001"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="text-slate-300">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value || "USD" })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="USD" className="text-white">
                      USD
                    </SelectItem>
                    <SelectItem value="EUR" className="text-white">
                      EUR
                    </SelectItem>
                    <SelectItem value="GBP" className="text-white">
                      GBP
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-slate-300">
                Transaction Type
              </Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, transaction_type: value })
                }
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="deposit" className="text-white">
                    Deposit
                  </SelectItem>
                  <SelectItem value="withdrawal" className="text-white">
                    Withdrawal
                  </SelectItem>
                  <SelectItem value="transfer" className="text-white">
                    Transfer
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
              {isLoading ? "Creating..." : "Create Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
