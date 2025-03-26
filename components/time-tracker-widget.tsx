"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { format, parseISO, isWithinInterval, subDays } from "date-fns"
import { PlayCircle, PauseCircle, StopCircle, CalendarPlus, Clock, Zap, History } from "lucide-react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { TimeEntry, Project } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Live Clock component
function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center bg-muted/20 p-1.5 sm:p-2 md:p-4 rounded-lg border border-border">
      <p className="text-xs sm:text-sm font-medium mb-0 sm:mb-1">Current Time</p>
      <div className="text-base sm:text-xl md:text-2xl font-mono font-semibold tabular-nums">
        {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
    </div>
  )
}

// Quick Time Preset component
function QuickTimePreset({
  onSelect,
  isDisabled,
}: { onSelect: (hours: number, minutes: number) => void; isDisabled: boolean }) {
  const presets = [
    { label: "30m", hours: 0, minutes: 30 },
    { label: "1h", hours: 1, minutes: 0 },
    { label: "1h 30m", hours: 1, minutes: 30 },
    { label: "2h", hours: 2, minutes: 0 },
  ]

  return (
    <div className="space-y-1 sm:space-y-2">
      <div className="flex items-center">
        <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground mr-1 sm:mr-1.5" />
        <p className="text-xxs sm:text-xs font-medium text-muted-foreground">Quick presets</p>
      </div>
      <div className="flex flex-wrap gap-standard">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            className="text-xxs sm:text-xs h-6 sm:h-7"
            onClick={() => onSelect(preset.hours, preset.minutes)}
            disabled={isDisabled}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Recent Projects component
function RecentProjects({
  projects,
  onSelect,
  isDisabled,
}: {
  projects: Project[]
  onSelect: (projectId: string) => void
  isDisabled: boolean
}) {
  // In a real app, you'd track recently used projects
  // Here we'll just use the first 3 projects as an example
  const recentProjects = projects.slice(0, 3)

  if (recentProjects.length === 0) return null

  return (
    <div className="space-y-1 sm:space-y-2">
      <div className="flex items-center">
        <History className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground mr-1 sm:mr-1.5" />
        <p className="text-xxs sm:text-xs font-medium text-muted-foreground">Recent projects</p>
      </div>
      <div className="flex flex-wrap gap-standard">
        {recentProjects.map((project) => (
          <Button
            key={project.id}
            variant="outline"
            size="sm"
            className="text-xxs sm:text-xs h-6 sm:h-7"
            onClick={() => onSelect(project.id)}
            disabled={isDisabled}
          >
            {project.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

interface TimeTrackerWidgetProps {
  projects: Project[]
  timeEntries: TimeEntry[]
  onAddEntry: (entry: TimeEntry) => void
}

// Schema for the live timer form
const liveTimerSchema = z.object({
  projectId: z
    .string({
      required_error: "Please select a project",
    })
    .min(1, "Project selection is required"),
  description: z.string().optional(),
})

// Schema for the manual entry form
const manualEntrySchema = z
  .object({
    projectId: z
      .string({
        required_error: "Please select a project",
      })
      .min(1, "Project selection is required"),
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

export function TimeTrackerWidget({ projects, timeEntries, onAddEntry }: TimeTrackerWidgetProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [overlapError, setOverlapError] = useState<string | null>(null)
  const [manualEntryError, setManualEntryError] = useState<string | null>(null)
  const [activeAccordion, setActiveAccordion] = useState<string>("live-timer")
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const liveTimerFormRef = useRef<HTMLFormElement>(null)
  const manualEntryFormRef = useRef<HTMLFormElement>(null)

  // Live timer form
  const liveTimerForm = useForm<z.infer<typeof liveTimerSchema>>({
    resolver: zodResolver(liveTimerSchema),
    defaultValues: {
      projectId: "",
      description: "",
    },
    mode: "onChange", // Validate on change
  })

  // Manual entry form
  const manualEntryForm = useForm<z.infer<typeof manualEntrySchema>>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      projectId: "",
      description: "",
      date: new Date(),
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
    mode: "onChange",
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if the active element is a form control or inside a dropdown
      const isFormElement =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLButtonElement ||
        (e.target as HTMLElement)?.closest('[role="combobox"]') ||
        (e.target as HTMLElement)?.closest('[role="listbox"]') ||
        (e.target as HTMLElement)?.closest('[role="option"]')

      // Only apply shortcuts when not interacting with form elements
      if (isFormElement) {
        return
      }

      // Alt+L to focus live timer
      if (e.altKey && e.key === "l") {
        e.preventDefault()
        setActiveAccordion("live-timer")
      }
      // Alt+M to focus manual entry
      else if (e.altKey && e.key === "m" && !isRunning) {
        e.preventDefault()
        setActiveAccordion("manual-entry")
      }
      // Remove all spacebar hotkey functionality
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isRunning, activeAccordion])

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        setElapsedTime(Math.floor((now.getTime() - startTime.getTime()) / 1000))
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, startTime])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Check for time entry overlaps
  const checkForOverlaps = (startTime: Date, endTime: Date): boolean => {
    for (const entry of timeEntries) {
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

  const handleStart = (values: z.infer<typeof liveTimerSchema>) => {
    if (!values.projectId) {
      return
    }

    setIsRunning(true)
    setStartTime(new Date())
    setElapsedTime(0)
    setOverlapError(null)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleResume = () => {
    if (startTime) {
      const newStartTime = new Date(new Date().getTime() - elapsedTime * 1000)
      setStartTime(newStartTime)
      setIsRunning(true)
    }
  }

  const handleStop = () => {
    if (startTime && elapsedTime > 0) {
      const values = liveTimerForm.getValues()
      const endTime = new Date()

      // Check for overlaps
      if (checkForOverlaps(startTime, endTime)) {
        setOverlapError("This time entry overlaps with an existing entry. Please adjust the time.")
        return
      }

      const projectName = projects.find((p) => p.id === values.projectId)?.name || ""

      const newEntry: TimeEntry = {
        id: `entry-${Date.now()}`,
        projectId: values.projectId,
        projectName,
        description: values.description || "",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: elapsedTime,
        date: format(startTime, "yyyy-MM-dd"),
      }

      onAddEntry(newEntry)
      setIsRunning(false)
      setStartTime(null)
      setElapsedTime(0)
      setOverlapError(null)
      liveTimerForm.reset()

      // Show success message
      setSuccessMessage(`Added ${formatTime(elapsedTime)} to ${projectName}`)
      setShowSuccess(true)
    }
  }

  const onLiveTimerSubmit = (values: z.infer<typeof liveTimerSchema>) => {
    if (!isRunning) {
      // Start the timer
      handleStart(values)
    }
  }

  const onManualEntrySubmit = (values: z.infer<typeof manualEntrySchema>) => {
    // Check if the form is valid before proceeding
    if (!manualEntryForm.formState.isValid) {
      return
    }

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
    if (checkForOverlaps(startTime, endTime)) {
      setManualEntryError("This time entry overlaps with an existing entry. Please adjust the time.")
      return
    }

    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}`,
      projectId,
      projectName,
      description: description || "",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      date: format(date, "yyyy-MM-dd"),
    }

    onAddEntry(newEntry)
    setManualEntryError(null)
    manualEntryForm.reset({
      projectId: "",
      description: "",
      date: new Date(),
      hours: 0,
      minutes: 0,
      seconds: 0,
    })

    // Show success message
    setSuccessMessage(`Added ${formatTime(duration)} to ${projectName}`)
    setShowSuccess(true)
  }

  // Handle quick time preset selection
  const handleQuickTimePreset = (hours: number, minutes: number) => {
    manualEntryForm.setValue("hours", hours)
    manualEntryForm.setValue("minutes", minutes)
    manualEntryForm.setValue("seconds", 0)

    // Trigger validation to update form state
    manualEntryForm.trigger(["hours", "minutes", "seconds"])
  }

  // Handle recent project selection
  const handleRecentProjectSelect = (projectId: string) => {
    if (activeAccordion === "live-timer") {
      liveTimerForm.setValue("projectId", projectId)
      // Trigger validation to update the Start button state
      liveTimerForm.trigger("projectId")
    } else {
      manualEntryForm.setValue("projectId", projectId)
      // Trigger validation for the manual entry form as well
      manualEntryForm.trigger("projectId")
    }
  }

  // Handle quick date selection
  const handleQuickDateSelect = (daysAgo: number) => {
    const date = subDays(new Date(), daysAgo)
    manualEntryForm.setValue("date", date)
  }

  // Add this function after the handleQuickDateSelect function
  const handleManualFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !manualEntryForm.formState.isValid) {
      e.preventDefault()
    }
  }

  return (
    <div className="w-full relative overflow-hidden">
      {/* Success message toast */}
      {showSuccess && (
        <div className="absolute top-2 right-2 z-50 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-md animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500"></div>
            <p className="text-xs sm:text-sm font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      <CardHeader className="p-standard pb-2 sm:pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base sm:text-xl font-bold">Time Tracker</CardTitle>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={activeAccordion === "live-timer" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAccordion("live-timer")}
              disabled={isRunning && activeAccordion !== "live-timer"}
              className="text-xs"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              Live Timer
            </Button>
            <Button
              variant={activeAccordion === "manual-entry" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAccordion("manual-entry")}
              disabled={isRunning}
              className="text-xs"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1" />
              Manual Entry
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 p-standard">
        {/* Recent Projects */}
        <RecentProjects projects={projects} onSelect={handleRecentProjectSelect} isDisabled={isRunning} />

        {/* Live Timer Section */}
        {activeAccordion === "live-timer" && (
          <div className="space-y-3 sm:space-y-4 border rounded-lg p-standard">
            {overlapError && (
              <Alert variant="destructive" className="mb-3 sm:mb-4 py-1.5 sm:py-3 text-xs sm:text-sm">
                <AlertDescription>{overlapError}</AlertDescription>
              </Alert>
            )}

            <Form {...liveTimerForm}>
              <form
                ref={liveTimerFormRef}
                onSubmit={liveTimerForm.handleSubmit(onLiveTimerSubmit)}
                className="space-y-3 sm:space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-standard">
                  <FormField
                    control={liveTimerForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Project <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select disabled={isRunning} onValueChange={field.onChange} value={field.value}>
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
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={liveTimerForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What are you working on?"
                            disabled={isRunning}
                            {...field}
                            className="bg-background h-8 sm:h-10 text-xs sm:text-sm"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-standard">
                  <div className="flex flex-col items-center">
                    <p className="text-xs sm:text-sm font-medium mb-1">Elapsed Time</p>
                    <div
                      className={cn(
                        "text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-mono font-bold tabular-nums bg-muted/30 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 rounded-lg w-full text-center",
                        isRunning && "animate-pulse text-primary",
                      )}
                      aria-live="polite"
                      aria-label={`Timer at ${formatTime(elapsedTime)}`}
                    >
                      {formatTime(elapsedTime)}
                    </div>
                  </div>

                  <LiveClock />
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-1 sm:pt-2">
                  {!isRunning && elapsedTime === 0 && (
                    <Button
                      type="submit"
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-4 transition-all hover:scale-105 text-xs sm:text-sm h-8 sm:h-10"
                      disabled={!liveTimerForm.formState.isValid}
                    >
                      <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Start
                    </Button>
                  )}

                  {isRunning && (
                    <Button
                      type="button"
                      onClick={handlePause}
                      variant="outline"
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-4 transition-all hover:scale-105 text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <PauseCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Pause
                    </Button>
                  )}

                  {!isRunning && elapsedTime > 0 && (
                    <Button
                      type="button"
                      onClick={handleResume}
                      variant="outline"
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-4 transition-all hover:scale-105 text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Resume
                    </Button>
                  )}

                  {(isRunning || elapsedTime > 0) && (
                    <Button
                      type="button"
                      onClick={handleStop}
                      variant="destructive"
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-4 transition-all hover:scale-105 text-xs sm:text-sm h-8 sm:h-10"
                    >
                      <StopCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      Stop
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Manual Entry Section */}
        {activeAccordion === "manual-entry" && (
          <div className="space-y-3 sm:space-y-4 border rounded-lg p-standard">
            {manualEntryError && (
              <Alert variant="destructive" className="mb-3 sm:mb-4 py-1.5 sm:py-3 text-xs sm:text-sm">
                <AlertDescription>{manualEntryError}</AlertDescription>
              </Alert>
            )}

            <Form {...manualEntryForm}>
              <form
                ref={manualEntryFormRef}
                onSubmit={manualEntryForm.handleSubmit(onManualEntrySubmit)}
                onKeyDown={handleManualFormKeyDown}
                className="space-y-3 sm:space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-standard">
                  <FormField
                    control={manualEntryForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Project <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background h-8 sm:h-10 text-xs sm:text-sm px-3 py-2">
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
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={manualEntryForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What did you work on?"
                            {...field}
                            className="bg-background h-8 sm:h-10 text-xs sm:text-sm px-3 py-2"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormField
                    control={manualEntryForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-xs sm:text-sm">
                          Date <span className="text-destructive">*</span>
                        </FormLabel>
                        <div className="flex flex-col space-y-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 pr-2 py-2 text-left font-normal bg-background h-8 sm:h-10 text-xs sm:text-sm",
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

                          {/* Quick date selection */}
                          <div className="flex flex-wrap gap-standard">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xxs sm:text-xs h-6 sm:h-7"
                              onClick={() => handleQuickDateSelect(0)}
                            >
                              Today
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xxs sm:text-xs h-6 sm:h-7"
                              onClick={() => handleQuickDateSelect(1)}
                            >
                              Yesterday
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xxs sm:text-xs h-6 sm:h-7"
                              onClick={() => handleQuickDateSelect(2)}
                            >
                              2 days ago
                            </Button>
                          </div>
                        </div>
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <FormField
                      control={manualEntryForm.control}
                      name="hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Hours <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="24"
                              {...field}
                              className="bg-background h-8 sm:h-10 text-xs sm:text-sm px-3 py-2"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualEntryForm.control}
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
                              className="bg-background h-8 sm:h-10 text-xs sm:text-sm px-3 py-2"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={manualEntryForm.control}
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
                              className="bg-background h-8 sm:h-10 text-xs sm:text-sm px-3 py-2"
                            />
                          </FormControl>
                          <FormMessage className="text-destructive text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quick time presets */}
                  <QuickTimePreset onSelect={handleQuickTimePreset} isDisabled={false} />

                  <p className="text-xxs sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                    * At least one time field (hours, minutes, or seconds) must be greater than 0
                  </p>
                </div>

                <div className="pt-1 sm:pt-2">
                  <Button
                    type="submit"
                    className="w-full flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 md:py-4 transition-all hover:scale-105 text-xs sm:text-sm h-8 sm:h-10"
                    disabled={!manualEntryForm.formState.isValid}
                  >
                    <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Add Time Entry
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </div>
  )
}

