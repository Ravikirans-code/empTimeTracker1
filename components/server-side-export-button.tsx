"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, FileDown } from "lucide-react"

interface ServerSideExportButtonProps {
  filters?: Record<string, string>
  className?: string
  children?: React.ReactNode
}

export function ServerSideExportButton({ filters = {}, className, children }: ServerSideExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Build query string from filters
      const queryParams = new URLSearchParams(filters).toString()
      const url = `/api/export?${queryParams}`

      // Trigger file download
      window.location.href = url

      // Set a timeout to reset the button state
      // (since we can't detect when the download completes)
      setTimeout(() => {
        setIsExporting(false)
      }, 3000)
    } catch (error) {
      console.error("Export error:", error)
      setIsExporting(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={isExporting} className={className}>
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing Export...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          {children || "Export to Excel"}
        </>
      )}
    </Button>
  )
}

