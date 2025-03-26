"use client"

import { useState } from "react"
import { ExcelExportButton } from "@/components/excel-export-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface DataExportPageProps {
  data: any[]
  title?: string
  description?: string
}

export default function DataExportPage({
  data,
  title = "Export Data",
  description = "Export your data to Excel format",
}: DataExportPageProps) {
  const [isExporting, setIsExporting] = useState(false)

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Large Dataset</AlertTitle>
              <AlertDescription>
                You are about to export {data.length.toLocaleString()} records. The export process will run in the
                background and your UI will remain responsive.
              </AlertDescription>
            </Alert>
          </div>

          <ExcelExportButton
            data={data}
            fileName="large-data-export.xlsx"
            onExportStart={() => setIsExporting(true)}
            onExportComplete={() => setIsExporting(false)}
          />

          {isExporting && (
            <p className="mt-4 text-sm text-muted-foreground">
              Export is processing in the background. You can continue using the application.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

