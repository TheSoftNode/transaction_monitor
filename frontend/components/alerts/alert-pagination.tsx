"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface AlertPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AlertPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AlertPaginationProps) {
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-slate-400">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          variant="outline"
          size="sm"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
