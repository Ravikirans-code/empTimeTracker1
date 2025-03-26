import { TimeEntryHistory } from "@/components/time-entry-history"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TimeTrack - History",
  description: "View and manage your time entries",
}

export default function HistoryPage() {
  return <TimeEntryHistory />
}

