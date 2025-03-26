"use client"
import { useState, useEffect } from "react"
import { format, parseISO, isWithinInterval } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TimeEntry, Project } from "@/types"

interface EditTimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: TimeEntry
  projects: Project[]
  allEntries: TimeEntry[]
  onUpdate: (entry: TimeEntry) => void
}

// Update the schema to include seconds and validation
const formSchema = z
  .object({
    projectId: z.string({
      required_error: "Please select a project",
    }),
    description: z.string().optional(),
    date: z.date({
      required_error: "Please select a date",
    }),
    hours: z.coerce.number().min(0, "Hours must be 0 or greater").max(24, "Hours cannot exceed 24"),
    minutes: z.coerce.number().min(0, "Minutes must be 0 or greater").max(59, "Minutes cannot exceed 59"),
    seconds: z.coerce.number().min(0, "Seconds must be 0 or greater").max(59, "Seconds cannot exceed 59"),
  })
  .refine(
    (data) => {
      return data.hours > 0 || data.minutes > 0 || data.seconds > 0
    },
    {
      message: "Total duration must be greater than 0",
      path: ["hours"],
    },
  )

export function EditTimeEntryDialog({
  open,
  onOpenChange,
  entry,
  projects,
  allEntries,
  onUpdate,
}: EditTimeEntryDialogProps) {
  const [formChanged, setFormChanged] = useState(false)
  const [overlapError, setOverlapError] = useState<string | null>(null)

  // Calculate seconds from duration
  const hours = Math.floor(entry.duration / 3600)
  const minutes = Math.floor((entry.duration % 3600) / 60)
  const seconds = entry.duration % 60
  const date = parseISO(entry.startTime)

  // Update form default values to include seconds
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: entry.projectId,
      description: entry.description,
      date,
      hours,
      minutes,
      seconds,
    },
  })

  // Watch for form changes
  const watchedValues = form.watch()

  // Check if form has changed from initial values
  useEffect(() => {
    const initialValues = {
      projectId: entry.projectId,
      description: entry.description,
      date: date,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    }

    // Compare current values with initial values
    const hasChanged =
      watchedValues.projectId !== initialValues.projectId ||
      watchedValues.description !== initialValues.description ||
      (watchedValues.date && format(watchedValues.date, "yyyy-MM-dd") !== format(initialValues.date, "yyyy-MM-dd")) ||
      watchedValues.hours !== initialValues.hours ||
      watchedValues.minutes !== initialValues.minutes ||
      watchedValues.seconds !== initialValues.seconds

    setFormChanged(hasChanged)
  }, [watchedValues, entry, date, hours, minutes, seconds])

  // Check for time entry overlaps
  const checkForOverlaps = (startTime: Date, endTime: Date, entryId: string): boolean => {
    for (const entry of allEntries) {
      // Skip the current entry being edited
      if (entry.id === entryId) continue

      const entryStart = parseISO(entry.startTime)
      const entryEnd = parseISO(entry.endTime)

      // Check if the new entry overlaps with an existing entry
      if (
        isWithinInterval(startTime, { start: entryStart, end: entryEnd }) ||
        isWithinInterval(endTime, { start: entryStart, end: entryEnd }) ||
        (startTime <= entryStart && endTime >= entryEnd)
      ) {
        return true
      }
    }
    return false
  }

  // Update the onSubmit function to include seconds
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { projectId, description, date, hours, minutes, seconds } = values
    const projectName = projects.find((p) => p.id === projectId)?.name || ""

    // Calculate duration in seconds
    const duration = hours * 3600 + minutes * 60 + seconds

    // Create start and end times
    const startTime = new Date(date)
    startTime.setHours(9, 0, 0, 0) // Default to 9:00 AM

    const endTime = new Date(startTime)
    endTime.setSeconds(endTime.getSeconds() + duration)

    // Check for overlaps
    if (checkForOverlaps(startTime, endTime, entry.id)) {
      setOverlapError("This time entry overlaps with an existing entry. Please adjust the time.")
      return
    }

    const updatedEntry: TimeEntry = {
      ...entry,
      projectId,
      projectName,
      description: description || "",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      date: format(date, "yyyy-MM-dd"),
    }

    onUpdate(updatedEntry)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-standard max-w-[95vw] w-full">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-base sm:text-lg">Edit Time Entry</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Make changes to your time entry here.</DialogDescription>
        </DialogHeader>

        {overlapError && (
          <Alert variant="destructive" className="py-2 text-xs sm:text-sm">
            <AlertDescription>{overlapError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-standard">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Project</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background h-8 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id} className="text-xs sm:text-sm">
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What did you work on?"
                      {...field}
                      value={field.value || ""}
                      className="bg-background h-8 sm:h-10 text-xs sm:text-sm"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs sm:text-sm">Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-background h-8 sm:h-10 text-xs sm:text-sm",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="text-xs sm:text-sm"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-standard">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="24"
                        {...field}
                        className="bg-background h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Minutes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        {...field}
                        className="bg-background h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Seconds</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        {...field}
                        className="bg-background h-8 sm:h-10 text-xs sm:text-sm"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                disabled={!formChanged || !form.formState.isValid}
                className="transition-all hover:scale-105 text-xs sm:text-sm w-full sm:w-auto h-8 sm:h-10"
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

