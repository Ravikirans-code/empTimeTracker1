"use client"
import { TimeEntryList } from "@/components/time-entry-list"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/components/ui/use-toast"
import type { TimeEntry, Project } from "@/types"

export function TimeEntryHistory() {
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>("time-entries", [])
  const { toast, dismiss } = useToast()

  // Sample projects - in a real app, these would come from an API
  const projects: Project[] = [
    { id: "project-1", name: "Website Redesign" },
    { id: "project-2", name: "Mobile App Development" },
    { id: "project-3", name: "Marketing Campaign" },
    { id: "project-4", name: "Internal Tools" },
  ]

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
        duration: 8000,
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
                duration: 3000,
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
    </div>
  )
}

