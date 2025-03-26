"use client"

import { useState, useCallback } from "react"

export function useExcelExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const exportToExcel = useCallback(
    async (
      data: any[],
      options: {
        fileName?: string
        sheetName?: string
      } = {},
    ) => {
      setIsExporting(true)
      setProgress(0)
      setError(null)

      try {
        // Create a new worker
        const worker = new Worker(new URL("../workers/excel-worker.ts", import.meta.url), { type: "module" })

        // Set up message handler
        worker.onmessage = (event) => {
          const { status, result, error: workerError } = event.data

          if (status === "success") {
            // Convert array buffer to blob
            const blob = new Blob([result], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            })

            // Create download link and trigger download
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = options.fileName || "export.xlsx"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            setProgress(100)
            setIsExporting(false)
          } else if (status === "error") {
            setError(workerError)
            setIsExporting(false)
          } else if (status === "progress") {
            setProgress(event.data.progress)
          }

          // Terminate the worker when done
          if (status === "success" || status === "error") {
            worker.terminate()
          }
        }

        // Send data to worker
        worker.postMessage({ data, options })
      } catch (err) {
        setError(err.message)
        setIsExporting(false)
      }
    },
    [],
  )

  return { exportToExcel, isExporting, progress, error }
}

