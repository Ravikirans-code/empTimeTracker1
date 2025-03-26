import { TimeReportsPage } from "@/components/time-reports-page"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TimeTrack - Reports",
  description: "Analyze your time usage",
}

export default function ReportsPage() {
  return <TimeReportsPage />
}

