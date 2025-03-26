import * as XLSX from "xlsx"

/**
 * Optimized function to convert data to Excel format
 */
export function generateExcelFile(
  data: any[],
  options: {
    sheetName?: string
    columns?: { key: string; header: string }[]
    dateFields?: string[]
  } = {},
) {
  const { sheetName = "Sheet1", columns, dateFields = [] } = options

  // If columns are specified, map the data to include only those columns
  const processedData = columns
    ? data.map((item) => {
        const row: Record<string, any> = {}
        columns.forEach((col) => {
          row[col.header] = item[col.key]
        })
        return row
      })
    : data

  // Convert date strings to Excel date format for better Excel compatibility
  if (dateFields.length > 0) {
    processedData.forEach((row) => {
      dateFields.forEach((field) => {
        if (row[field]) {
          // Convert to JavaScript Date object
          const date = new Date(row[field])
          if (!isNaN(date.getTime())) {
            // Convert to Excel serial number (Excel uses a different epoch)
            row[field] = XLSX.SSF.parse_date_code(Math.round(date.getTime() / 86400000 + 25569))
          }
        }
      })
    })
  }

  // Create worksheet with the processed data
  const worksheet = XLSX.utils.json_to_sheet(processedData)

  // Set column widths based on content
  const colWidths = determineColumnWidths(processedData, columns)
  worksheet["!cols"] = colWidths.map((width) => ({ wch: width }))

  // Create workbook and append the worksheet
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Return the workbook
  return workbook
}

/**
 * Helper function to determine optimal column widths
 */
function determineColumnWidths(data: any[], columns?: { key: string; header: string }[]): number[] {
  if (!data.length) return []

  // Get all column keys
  const keys = columns ? columns.map((col) => col.header) : Object.keys(data[0])

  // Initialize with header lengths (minimum width)
  const widths = keys.map((key) => Math.max(10, key.length))

  // Check each row's values
  data.forEach((row) => {
    keys.forEach((key, i) => {
      const value = String(row[key] || "")
      // Limit max width to 50 characters
      widths[i] = Math.min(50, Math.max(widths[i], value.length))
    })
  })

  return widths
}

