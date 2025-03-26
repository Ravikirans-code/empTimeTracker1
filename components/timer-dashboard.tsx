"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Clock, PauseCircle, PlayCircle, StopCircle, BarChart3, History } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimeEntryList } from "@/components/time-entry-list"
import { TimeReports } from "@/components/time-reports"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { TimeEntry, Project } from "@/types"

export function TimerDashboard() {
  const [activeTab, setActiveTab] = useState("timer")
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentProject, setCurrentProject] = useState("")
  const [description, setDescription] = useState("")
  const [timeEntries, setTimeEntries] = useLocalStorage<TimeEntry[]>("time-entries", [])

  const projects: Project[] = [
    { id: "project-1", name: "Website Redesign" },
    { id: "project-2", name: "Mobile App Development" },
    { id: "project-3", name: "Marketing Campaign" },
    { id: "project-4", name: "Internal Tools" },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        setElapsedTime(Math.floor((now.getTime() - startTime.getTime()) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, startTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    if (!currentProject) {
      alert("Please select a project")
      return
    }

    setIsRunning(true)
    setStartTime(new Date())
    setElapsedTime(0)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleResume = () => {
    if (startTime) {
      // Calculate a new start time by subtracting the elapsed seconds from now
      const newStartTime = new Date(new Date().getTime() - elapsedTime * 1000)
      setStartTime(newStartTime)
      setIsRunning(true)
    }
  }

  const handleStop = () => {
    if (startTime && elapsedTime > 0) {
      const endTime = new Date()
      const newEntry: TimeEntry = {
        id: `entry-${Date.now()}`,
        projectId: currentProject,
        projectName: projects.find((p) => p.id === currentProject)?.name || "",
        description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: elapsedTime,
        date: format(startTime, "yyyy-MM-dd"),
      }

      // Use functional update to avoid dependency on current timeEntries
      setTimeEntries((prevEntries) => [newEntry, ...prevEntries])
      setIsRunning(false)
      setStartTime(null)
      setElapsedTime(0)
      setDescription("")
    }
  }

  return (
    <Tabs defaultValue="timer" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="timer" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Timer</span>
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">History</span>
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Reports</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="timer" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Track Your Time</CardTitle>
            <CardDescription>Start the timer when you begin working on a task.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={currentProject} onValueChange={setCurrentProject} disabled={isRunning}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isRunning}
              />
            </div>

            <div className="flex justify-center py-8">
              <div
                className="text-4xl sm:text-5xl font-mono font-bold tabular-nums"
                aria-live="polite"
                aria-label={`Timer at ${formatTime(elapsedTime)}`}
              >
                {formatTime(elapsedTime)}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {!isRunning && elapsedTime === 0 && (
              <Button onClick={handleStart} className="flex items-center gap-2" aria-label="Start timer">
                <PlayCircle className="h-5 w-5" />
                <span>Start</span>
              </Button>
            )}

            {isRunning && (
              <Button
                onClick={handlePause}
                variant="outline"
                className="flex items-center gap-2"
                aria-label="Pause timer"
              >
                <PauseCircle className="h-5 w-5" />
                <span>Pause</span>
              </Button>
            )}

            {!isRunning && elapsedTime > 0 && (
              <Button
                onClick={handleResume}
                variant="outline"
                className="flex items-center gap-2"
                aria-label="Resume timer"
              >
                <PlayCircle className="h-5 w-5" />
                <span>Resume</span>
              </Button>
            )}

            {elapsedTime > 0 && (
              <Button
                onClick={handleStop}
                variant="destructive"
                className="flex items-center gap-2"
                aria-label="Stop timer and save entry"
              >
                <StopCircle className="h-5 w-5" />
                <span>Stop</span>
              </Button>
            )}
          </CardFooter>
        </Card>

        {timeEntries.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Recent Entries</h3>
            <TimeEntryList entries={timeEntries.slice(0, 3)} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Entry History</CardTitle>
            <CardDescription>View and manage your time entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <TimeEntryList
              entries={timeEntries}
              showActions={true}
              onDelete={(id) => {
                setTimeEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id))
              }}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reports" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Reports</CardTitle>
            <CardDescription>Analyze your time usage.</CardDescription>
          </CardHeader>
          <CardContent>
            <TimeReports entries={timeEntries} projects={projects} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

