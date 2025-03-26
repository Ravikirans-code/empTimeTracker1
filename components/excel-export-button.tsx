"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useExcelExport } from "@/hooks/use-excel-export"
import { FileDown, Loader2 } from "lucide-react"

interface ExcelExportButtonProps {
  data: any[]
  fileName?: string
  sheetName?: string
  onExportStart?: () => void
  onExportComplete?: () => void
  className?: string
  children?: React.ReactNode
}

export function ExcelExportButton({
  data,
  fileName = "export.xlsx",
  sheetName = "Sheet1",
  onExportStart,
  onExportComplete,
  className,
  children,
}: ExcelExportButtonProps) {
  const { exportToExcel, isExporting, progress, error } = useExcelExport()

  const handleExport = async () => {
    if (isExporting) return

    onExportStart?.()
    await exportToExcel(data, { fileName, sheetName })
    onExportComplete?.()
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleExport} disabled={isExporting} className={className}>
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <FileDown className="mr-2 h-4 w-4" />
            {children || "Export to Excel"}
          </>
        )}
      </Button>

      {isExporting && <Progress value={progress} className="h-2 w-full" />}

      {error && <p className="text-sm text-red-500">Error: {error}</p>}
    </div>
  )
}

