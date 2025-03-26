import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getDataFromDatabase } from "@/lib/data"

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      // Add other filters as needed
    }

    // Fetch data from database or other source
    const data = await getDataFromDatabase(filters)

    // Generate Excel file
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export")

    // Convert to buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" })

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="data-export.xlsx"',
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to generate export" }, { status: 500 })
  }
}

