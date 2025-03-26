"use client"

import { TimeReports } from "@/components/time-reports"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { TimeEntry, Project } from "@/types"

export function TimeReportsPage() {
  const [timeEntries] = useLocalStorage<TimeEntry[]>("time-entries", [])

  // Sample projects - in a real app, these would come from an API
  const projects: Project[] = [
    { id: "project-1", name: "Website Redesign" },
    { id: "project-2", name: "Mobile App Development" },
    { id: "project-3", name: "Marketing Campaign" },
    { id: "project-4", name: "Internal Tools" },
  ]

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="bg-card rounded-lg border shadow-lg p-2 sm:p-4 md:p-6">
        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-4">Time Reports</h3>
        <TimeReports entries={timeEntries} projects={projects} />
      </div>
    </div>
  )
}

