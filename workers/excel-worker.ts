// This code runs in a separate thread
import * as XLSX from "xlsx"

// Listen for messages from the main thread
self.onmessage = (event) => {
  const { data, options } = event.data
  const totalItems = data.length

  try {
    // Report start
    self.postMessage({ status: "progress", progress: 0 })

    // Process in chunks to report progress
    const chunkSize = 1000
    const chunks = Math.ceil(totalItems / chunkSize)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Process data in chunks and report progress
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, totalItems)
      const chunk = data.slice(start, end)

      // If this is the first chunk, create the worksheet
      if (i === 0) {
        const worksheet = XLSX.utils.json_to_sheet(chunk)
        XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || "Sheet1")
      } else {
        // Append to existing worksheet
        const worksheet = workbook.Sheets[options.sheetName || "Sheet1"]
        XLSX.utils.sheet_add_json(worksheet, chunk, {
          skipHeader: true,
          origin: -1, // Append at the end
        })
      }

      // Report progress
      const progress = Math.round((end / totalItems) * 100)
      self.postMessage({ status: "progress", progress })
    }

    // Convert to binary string
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      compression: true, // Enable compression for smaller file size
    })

    // Send the result back to the main thread
    self.postMessage({
      status: "success",
      result: excelBuffer,
    })
  } catch (error) {
    self.postMessage({
      status: "error",
      error: error.message,
    })
  }
}

