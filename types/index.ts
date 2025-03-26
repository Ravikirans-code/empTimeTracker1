export interface TimeEntry {
  id: string
  projectId: string
  projectName: string
  description: string
  startTime: string
  endTime: string
  duration: number // in seconds
  date: string // YYYY-MM-DD format
}

export interface Project {
  id: string
  name: string
}

