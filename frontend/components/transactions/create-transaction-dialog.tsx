"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { useGetCustomersQuery } from "@/features/customers/api/customersApi"
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
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [debouncedRef, setDebouncedRef] = useState("")

  // Debounce the customer-reference input used for searching
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedRef(formData.customer_reference.trim()),
      250
    )
    return () => clearTimeout(t)
  }, [formData.customer_reference])

  const { data: customersData, isFetching: customersLoading } =
    useGetCustomersQuery(
      { search: debouncedRef || undefined },
      { skip: !open }
    )
  const customers = customersData?.results ?? []

  // Resolve the typed reference to an exact customer (case-insensitive)
  const exactMatch = useMemo(() => {
    const ref = formData.customer_reference.trim().toLowerCase()
    if (!ref) return null
    return (
      customers.find(
        (c) => c.customer_reference.toLowerCase() === ref
      ) ?? null
    )
  }, [customers, formData.customer_reference])

  useEffect(() => {
    setCustomerId(exactMatch ? exactMatch.id : null)
  }, [exactMatch])

  const referenceEntered = formData.customer_reference.trim().length > 0
  const notFound = referenceEntered && !customersLoading && !exactMatch

  const resetForm = () => {
    setFormData({
      customer_reference: "",
      amount: "",
      currency: "USD",
      transaction_type: "deposit",
    })
    setCustomerId(null)
    setShowDropdown(false)
  }

  const handleSelectCustomer = (customer: {
    id: string
    customer_reference: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      customer_reference: customer.customer_reference,
    }))
    setCustomerId(customer.id)
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerId) {
      toast.error(
        `The customer with reference "${formData.customer_reference.trim()}" does not exist`
      )
      return
    }

    try {
      await createTransaction({
        transaction_reference: `TXN${Date.now()}${Math.floor(
          Math.random() * 1000
        )
          .toString()
          .padStart(3, "0")}`,
        customer: customerId,
        amount: formData.amount,
        currency: formData.currency,
        transaction_type: formData.transaction_type,
      }).unwrap()

      toast.success("Transaction created successfully!")
      resetForm()
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
              <div className="relative">
                <div className="relative">
                  <Input
                    id="customer"
                    autoComplete="off"
                    value={formData.customer_reference}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        customer_reference: e.target.value,
                      })
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowDropdown(false), 150)
                    }
                    className={`bg-slate-800 border-slate-700 text-white pr-9 ${
                      notFound ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    placeholder="Select or type a customer reference"
                    aria-invalid={notFound}
                    required
                  />
                  <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>

                {showDropdown && (
                  <div
                    className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-700 bg-slate-800 py-1 shadow-lg"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {customersLoading ? (
                      <div className="px-3 py-2 text-sm text-slate-400">
                        Searching…
                      </div>
                    ) : customers.length > 0 ? (
                      customers.map((customer) => {
                        const selected = customer.id === customerId
                        return (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => handleSelectCustomer(customer)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-white hover:bg-slate-700"
                          >
                            <span className="flex flex-col">
                              <span className="font-mono">
                                {customer.customer_reference}
                              </span>
                              <span className="text-xs text-slate-400">
                                {customer.full_name}
                              </span>
                            </span>
                            {selected && (
                              <Check className="h-4 w-4 shrink-0 text-violet-400" />
                            )}
                          </button>
                        )
                      })
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-400">
                        No customers found
                      </div>
                    )}
                  </div>
                )}
              </div>
              {notFound && (
                <p className="text-sm text-red-400">
                  The customer with reference &quot;
                  {formData.customer_reference.trim()}&quot; does not exist
                </p>
              )}
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
              disabled={isLoading || !customerId}
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
