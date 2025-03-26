"use client"

import { useState } from "react"
import { Clock, History, BarChart3 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimeTrackerWidget } from "@/components/time-tracker-widget"
import { TimeEntryList } from "@/components/time-entry-list"
import { TimeReports } from "@/components/time-reports"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import type { TimeEntry, Project } from "@/types"

export function TimeTrackerDashboard() {
  const [activeTab, setActiveTab] = useState("timer")
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>("time-entries", [])
  const { toast, dismiss } = useToast()

  // Sample projects - in a real app, these would come from an API
  const projects: Project[] = [
    { id: "project-1", name: "Website Redesign" },
    { id: "project-2", name: "Mobile App Development" },
    { id: "project-3", name: "Marketing Campaign" },
    { id: "project-4", name: "Internal Tools" },
  ]

  const handleAddEntry = (entry: TimeEntry) => {
    // Add the new entry to the beginning of the array
    setTimeEntries((prev) => [entry, ...prev])

    // Show a success toast
    toast({
      title: "Time entry added",
      description: `${entry.projectName}: ${formatDuration(entry.duration)}`,
    })
  }

  const handleUpdateEntry = (updatedEntry: TimeEntry) => {
    setTimeEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
    toast({
      title: "Time entry updated",
      description: `${updatedEntry.projectName}: ${formatDuration(updatedEntry.duration)}`,
    })
  }

  const handleDeleteEntry = (id: string) => {
    const entryToDelete = timeEntries.find((entry) => entry.id === id)
    setTimeEntries((prev) => prev.filter((entry) => entry.id !== id))

    if (entryToDelete) {
      // Create the toast and store its ID
      const { id: toastId } = toast({
        title: "Time entry deleted",
        description: `${entryToDelete.projectName}: ${formatDuration(entryToDelete.duration)}`,
        duration: 8000, // Increased from default 5000ms to 8000ms to give users more time
        action: (
          <button
            onClick={() => {
              // Dismiss this toast immediately when undo is clicked
              dismiss(toastId)

              // Restore the deleted entry
              setTimeEntries((prev) => [entryToDelete, ...prev.filter((e) => e.id !== entryToDelete.id)])

              // Show confirmation toast
              toast({
                title: "Time entry restored",
                description: `${entryToDelete.projectName}: ${formatDuration(entryToDelete.duration)}`,
                duration: 3000, // Shorter duration for confirmation toast
              })
            }}
            className="rounded bg-primary hover:bg-primary/90 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm font-medium text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Undo
          </button>
        ),
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours}h ${minutes}m ${secs}s`
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <Tabs defaultValue="timer" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-6">
          <TabsTrigger
            value="timer"
            className="flex items-center justify-center gap-1 transition-all duration-300 px-1 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Timer</span>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center justify-center gap-1 transition-all duration-300 px-1 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
          >
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">History</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="flex items-center justify-center gap-1 transition-all duration-300 px-1 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
          >
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
          <div className="bg-card rounded-lg border shadow-lg p-2 sm:p-4 md:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-4">Time Tracker</h3>
            <TimeTrackerWidget projects={projects} timeEntries={timeEntries} onAddEntry={handleAddEntry} />

            {timeEntries.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Recent Entries</h3>
                <TimeEntryList
                  entries={timeEntries.slice(0, 5)}
                  projects={projects}
                  allEntries={timeEntries}
                  onDelete={handleDeleteEntry}
                  onUpdate={handleUpdateEntry}
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
          <div className="bg-card rounded-lg border shadow-lg p-2 sm:p-4 md:p-6">
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 sm:mb-4">Time Entry History</h3>
            <TimeEntryList
              entries={timeEntries}
              projects={projects}
              allEntries={timeEntries}
              onDelete={handleDeleteEntry}
              onUpdate={handleUpdateEntry}
              showActions={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="animate-in fade-in-50 slide-in-from-left-5 duration-300">
          <div className="bg-card rounded-lg border shadow-lg p-2 sm:p-4 md:p-6">
            <TimeReports entries={timeEntries} projects={projects} />
          </div>
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}

