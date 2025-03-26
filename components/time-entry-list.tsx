"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Trash2, Edit2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { TimeEntry, Project } from "@/types"
import { EditTimeEntryDialog } from "@/components/edit-time-entry-dialog"

interface TimeEntryListProps {
  entries: TimeEntry[]
  projects: Project[]
  allEntries?: TimeEntry[]
  showActions?: boolean
  onDelete?: (id: string) => void
  onUpdate?: (entry: TimeEntry) => void
}

export function TimeEntryList({
  entries,
  projects,
  allEntries,
  showActions = false,
  onDelete,
  onUpdate,
}: TimeEntryListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    // For very small screens, use a more compact format
    if (window.innerWidth < 360) {
      return `${hours}h ${minutes}m`
    }

    return `${hours}h ${minutes}m ${secs}s`
  }

  const handleDeleteClick = (id: string) => {
    setSelectedEntryId(id)
    setDeleteDialogOpen(true)
  }

  const handleEditClick = (id: string) => {
    setSelectedEntryId(id)
    setEditDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedEntryId && onDelete) {
      onDelete(selectedEntryId)
    }
    setDeleteDialogOpen(false)
    setSelectedEntryId(null)
  }

  const selectedEntry = selectedEntryId ? entries.find((entry) => entry.id === selectedEntryId) : null

  if (entries.length === 0) {
    return (
      <div
        className="text-center py-3 sm:py-6 text-muted-foreground bg-muted/50 rounded-lg text-xs sm:text-sm"
        role="status"
        aria-live="polite"
      >
        No time entries yet
      </div>
    )
  }

  // For small screens, render a card-based layout
  const renderMobileView = () => (
    <div className="space-y-2 sm:space-y-3 md:hidden">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="border rounded-lg p-standard space-y-1 bg-card shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center">
            <div className="font-medium text-xs sm:text-sm">{entry.projectName}</div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3.5 w-3.5" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[120px]">
                  <DropdownMenuItem onClick={() => handleEditClick(entry.id)} className="text-xs">
                    <Edit2 className="h-3 w-3 mr-1.5" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 text-xs"
                    onClick={() => handleDeleteClick(entry.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="text-xs">
            {entry.description || <span className="text-muted-foreground italic">No description</span>}
          </div>
          <div className="flex justify-between items-center text-xs">
            <div>{format(parseISO(entry.startTime), "MMM dd, yyyy")}</div>
            <div className="font-medium">{formatDuration(entry.duration)}</div>
          </div>
        </div>
      ))}
    </div>
  )

  // For larger screens, render the table
  const renderTableView = () => (
    <div className="overflow-x-auto hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Duration</TableHead>
            {showActions && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>{format(parseISO(entry.startTime), "MMM dd, yyyy")}</TableCell>
              <TableCell className="p-standard font-medium text-xs sm:text-sm">{entry.projectName}</TableCell>
              <TableCell>
                {entry.description || <span className="text-muted-foreground italic">No description</span>}
              </TableCell>
              <TableCell className="font-medium">{formatDuration(entry.duration)}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(entry.id)}
                      aria-label={`Edit entry for ${entry.projectName}`}
                      className="hover:bg-muted transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(entry.id)}
                      aria-label={`Delete entry for ${entry.projectName}`}
                      className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div>
      {renderMobileView()}
      {renderTableView()}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] w-full sm:max-w-[425px] p-standard">
          <AlertDialogHeader className="space-y-1 sm:space-y-2">
            <AlertDialogTitle className="text-base sm:text-lg">Delete time entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This will permanently delete this time entry. This action cannot be undone.
            </AlertDialogDescription>
            {selectedEntry && (
              <div className="mt-1 sm:mt-2 p-1.5 sm:p-2 bg-muted/50 rounded-md text-xs sm:text-sm">
                <div className="font-medium">{selectedEntry.projectName}</div>
                <div>{selectedEntry.description || "No description"}</div>
                <div className="mt-1">
                  {format(parseISO(selectedEntry.startTime), "MMM dd, yyyy")} - {formatDuration(selectedEntry.duration)}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0 sm:mt-0 text-xs sm:text-sm h-8 sm:h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-xs sm:text-sm h-8 sm:h-10"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedEntry && onUpdate && (
        <EditTimeEntryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          entry={selectedEntry}
          projects={projects}
          allEntries={allEntries || entries}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

