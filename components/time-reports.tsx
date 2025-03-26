"use client"

import { useState, useEffect } from "react"
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, addWeeks } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { TimeEntry, Project } from "@/types"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useScreenSize } from "@/hooks/use-screen-size"

interface TimeReportsProps {
  entries: TimeEntry[]
  projects: Project[]
}

export function TimeReports({ entries, projects }: TimeReportsProps) {
  const [reportType, setReportType] = useState("weekly")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday as week start
  })
  const [chartRadius, setChartRadius] = useState(100)
  const { width } = useScreenSize()

  // Add this state to track hovered bar
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null)

  // Add this state to track hovered pie segment
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleResize = () => {
      // Adjust chart radius based on screen width
      if (width < 360) {
        setChartRadius(50)
      } else if (width < 480) {
        setChartRadius(70)
      } else if (width < 640) {
        setChartRadius(80)
      } else {
        setChartRadius(100)
      }
    }

    // Set initial size
    handleResize()
  }, [width])

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">No data available for reports</div>
    )
  }

  // Get current week dates
  const weekStart = currentWeekStart
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const goToNextWeek = () => {
    const nextWeek = addWeeks(currentWeekStart, 1)
    if (nextWeek <= new Date()) {
      setCurrentWeekStart(nextWeek)
    }
  }

  // Format time with seconds
  const formatTimeWithSeconds = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    // For zero time
    if (seconds === 0) {
      return "0h"
    }

    // For times with hours
    if (hours > 0) {
      if (minutes === 0 && secs === 0) {
        return `${hours}h` // Clean display for exact hours
      } else if (secs === 0) {
        return `${hours}h ${minutes}m` // No seconds
      } else {
        return `${hours}h ${minutes}m ${secs}s` // Full format
      }
    }

    // For times with minutes but no hours
    if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    }

    // For very small times (only seconds)
    return `${secs}s`
  }

  // Format time for display in tables
  const formatTimeForDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    // For zero time
    if (seconds === 0) {
      return "0h"
    }

    // For very small times (only seconds)
    if (hours === 0 && minutes === 0) {
      return `${secs}s`
    }

    // For times with minutes but no hours
    if (hours === 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    }

    // For times with hours
    if (minutes === 0 && secs === 0) {
      return `${hours}h` // Clean display for exact hours
    } else if (secs === 0) {
      return `${hours}h ${minutes}m` // No seconds
    } else {
      return `${hours}h ${minutes}m ${secs}s` // Full format
    }
  }

  // Prepare weekly data
  const weeklyData = weekDays.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const dayEntries = entries.filter((entry) => entry.date === dayStr)
    const totalSeconds = dayEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const hours = totalSeconds / 3600 // Convert to decimal hours

    return {
      day: format(day, "EEE"),
      hours: hours, // Keep as decimal for chart
      totalSeconds,
      formattedTime: formatTimeForDisplay(totalSeconds),
      date: dayStr,
    }
  })

  // Prepare project data
  const projectData = projects
    .map((project) => {
      const projectEntries = entries.filter((entry) => entry.projectId === project.id)
      const totalSeconds = projectEntries.reduce((sum, entry) => sum + entry.duration, 0)

      return {
        name: project.name,
        hours: totalSeconds / 3600, // Keep as decimal for chart
        totalSeconds,
        formattedTime: formatTimeForDisplay(totalSeconds),
        id: project.id,
      }
    })
    .filter((item) => item.totalSeconds > 0)
    .sort((a, b) => b.totalSeconds - a.totalSeconds) // Sort by most time spent

  // Calculate total hours this week
  const totalSecondsThisWeek = weeklyData.reduce((sum, day) => sum + day.totalSeconds, 0)

  // Colors for the charts
  const colors = ["#f97316", "#10b981", "#ef4444", "#ec4899", "#a855f7", "#84cc16", "#f43f5e", "#eab308"]

  // Custom tooltip formatter for charts
  const customTooltipFormatter = (value: any, name: string) => {
    if (name === "hours") {
      if (reportType === "weekly") {
        const seconds = Math.round(value * 3600) // Round to nearest second for weekly view
        return [formatTimeForDisplay(seconds), "Time"]
      } else {
        // For project view, show hours with 2 decimal places
        return [`${value.toFixed(2)}h (${formatTimeForDisplay(Math.round(value * 3600))})`, "Time"]
      }
    }
    return [value, name]
  }

  // Calculate appropriate Y-axis domain
  const calculateYAxisDomain = () => {
    const maxHours = Math.max(...weeklyData.map((item) => item.hours))

    if (maxHours === 0) {
      // No data, show a default scale
      return [0, 1]
    } else if (maxHours < 0.1) {
      // Very small values (less than 6 minutes)
      // Show a scale that makes the small values visible
      return [0, 0.5]
    } else if (maxHours < 1) {
      // Less than 1 hour but more than 6 minutes
      return [0, 1]
    } else {
      // Normal case - let the chart auto-scale with a minimum of 1 hour
      const ceiling = Math.ceil(maxHours * 1.2) // Add 20% padding
      return [0, Math.max(ceiling, 1)]
    }
  }

  // Format Y-axis ticks to always show hours
  const formatYAxisTick = (value: number) => {
    return `${value}h`
  }

  // Determine if we should use compact labels for small screens
  const useCompactLabels = width < 400

  // Custom label formatter for pie chart
  const renderCustomizedPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    // For very small screens, don't show labels at all
    if (width < 340) return null

    // For small screens, show shorter labels
    const displayName = useCompactLabels && name.length > 8 ? `${name.substring(0, 8)}...` : name

    return `${displayName}: ${(percent * 100).toFixed(0)}%`
  }

  // Near the top of the component, add this function
  const renderFallbackForTinyScreens = (data: typeof projectData) => {
    if (width >= 320) return null

    return (
      <div className="bg-muted/20 p-2 rounded-md text-center">
        <p className="text-xs font-medium mb-2">Project Distribution</p>
        <div className="space-y-1.5">
          {data.map((project, index) => {
            const totalSeconds = data.reduce((sum, p) => sum + p.totalSeconds, 0)
            const percentage = totalSeconds > 0 ? ((project.totalSeconds / totalSeconds) * 100).toFixed(1) : "0.0"

            return (
              <div key={project.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="truncate max-w-[100px]">{project.name}</span>
                </div>
                <div className="flex gap-2">
                  <span>{project.formattedTime}</span>
                  <span>{percentage}%</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-standard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <h3 className="text-base sm:text-lg md:text-xl font-bold">Time Analysis</h3>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger
            className="w-full sm:w-[180px] h-7 sm:h-10 text-xs sm:text-sm px-2 sm:px-3"
            aria-label="Select report type"
          >
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly" className="text-xs sm:text-sm">
              {width < 340 ? "Weekly" : "Weekly Overview"}
            </SelectItem>
            <SelectItem value="projects" className="text-xs sm:text-sm">
              {width < 340 ? "Projects" : "By Project"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {reportType === "weekly" && (
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="pb-1 sm:pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center p-standard">
              <div>
                <CardTitle className="text-base sm:text-lg">Weekly Hours</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {format(weekStart, "MMM dd")} - {format(weekEnd, "MMM dd, yyyy")}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousWeek}
                  aria-label="Previous week"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextWeek}
                  disabled={addWeeks(currentWeekStart, 1) > new Date()}
                  aria-label="Next week"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-standard pt-0">
              <VisuallyHidden>
                <h4>Weekly hours chart</h4>
                <p>{weeklyData.map((day) => `${day.day}: ${day.formattedTime}. `)}</p>
              </VisuallyHidden>
              <div className="h-[180px] sm:h-[220px] md:h-[280px]" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weeklyData}
                    margin={{
                      top: 20,
                      right: width < 360 ? 0 : width < 480 ? 10 : 30,
                      left: width < 360 ? -20 : 0,
                      bottom: 5,
                    }}
                    barCategoryGap={width < 320 ? "10%" : "20%"}
                  >
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: width < 360 ? 9 : 12 }}
                      tickMargin={width < 360 ? 3 : 8}
                      axisLine={{ strokeWidth: width < 360 ? 1 : 1.5 }}
                    />
                    <YAxis
                      label={{
                        value: width < 320 ? "" : "Hours", // Remove label on tiny screens
                        angle: -90,
                        position: "insideLeft",
                        style: {
                          fontSize: width < 360 ? 9 : 12,
                          textAnchor: "middle",
                        },
                        offset: width < 360 ? -5 : 0,
                      }}
                      tickFormatter={formatYAxisTick}
                      domain={calculateYAxisDomain()}
                      scale="linear"
                      allowDecimals={true}
                      tick={{ fontSize: width < 360 ? 9 : 12 }}
                      tickMargin={width < 360 ? 1 : 5}
                      width={width < 360 ? 20 : 35}
                      axisLine={{ strokeWidth: width < 360 ? 1 : 1.5 }}
                      tickCount={width < 320 ? 3 : 5}
                    />
                    <Tooltip
                      formatter={customTooltipFormatter}
                      labelFormatter={(label) => {
                        const dayData = weeklyData.find((d) => d.day === label)
                        return dayData ? format(parseISO(dayData.date), "EEEE, MMM dd") : label
                      }}
                      contentStyle={{
                        fontSize: width < 360 ? 10 : 12,
                        padding: width < 360 ? "5px" : "8px",
                      }}
                      position={{ x: width < 360 ? 10 : undefined, y: width < 360 ? 10 : undefined }}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Bar
                      dataKey="hours"
                      fill="#f97316"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={width < 360 ? 20 : width < 480 ? 30 : 40}
                      onMouseEnter={(data, index) => setActiveBarIndex(index)}
                      onMouseLeave={() => setActiveBarIndex(null)}
                    >
                      {weeklyData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={activeBarIndex === index ? "#e86207" : "#f97316"}
                          opacity={1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 sm:mt-4 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total time this week:{" "}
                  <span className="font-medium text-foreground">{formatTimeForDisplay(totalSecondsThisWeek)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Weekly summary table */}
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="p-2 sm:p-3 md:p-6 pb-1 sm:pb-2 md:pb-3">
              <CardTitle className="text-base sm:text-lg">Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-standard pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm p-1 sm:p-2">Day</TableHead>
                      <TableHead className="text-xs sm:text-sm p-1 sm:p-2">Date</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm p-1 sm:p-2">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weeklyData.map((day) => (
                      <TableRow key={day.day}>
                        <TableCell className="p-standard text-xs sm:text-sm">{day.day}</TableCell>
                        <TableCell className="py-1 sm:py-2 px-1 sm:px-4 text-xs sm:text-sm">
                          {format(parseISO(day.date), width < 360 ? "MM/dd" : "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="py-1 sm:py-2 px-1 sm:px-4 text-right text-xs sm:text-sm">
                          {day.formattedTime}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="text-xs sm:text-sm p-1 sm:p-2">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm p-1 sm:p-2">
                        {formatTimeForDisplay(totalSecondsThisWeek)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === "projects" && (
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-md overflow-hidden">
            <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 md:p-6">
              <CardTitle className="text-base sm:text-lg">Time by Project</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Distribution of hours across projects</CardDescription>
            </CardHeader>
            <CardContent className="p-standard pt-0">
              <VisuallyHidden>
                <h4>Project distribution chart</h4>
                <ul>
                  {projectData.map((project) => (
                    <li key={project.id}>
                      {project.name}: {project.formattedTime}
                    </li>
                  ))}
                </ul>
              </VisuallyHidden>
              <div className="h-[180px] sm:h-[220px] md:h-[280px]" aria-hidden="true">
                {width < 320 ? (
                  renderFallbackForTinyScreens(projectData)
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectData}
                        cx="50%"
                        cy="50%"
                        labelLine={width < 340 ? false : true}
                        outerRadius={chartRadius}
                        dataKey="hours"
                        nameKey="name"
                        label={renderCustomizedPieLabel}
                        paddingAngle={width < 360 ? 1 : 2}
                        onMouseEnter={(data, index) => setActivePieIndex(index)}
                        onMouseLeave={() => setActivePieIndex(null)}
                      >
                        {projectData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                            opacity={1}
                            stroke={activePieIndex === index ? "#ffffff" : "none"}
                            strokeWidth={activePieIndex === index ? 2 : 0}
                            style={activePieIndex === index ? { filter: "brightness(1.1)" } : {}}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={customTooltipFormatter}
                        contentStyle={{
                          fontSize: width < 360 ? 10 : 12,
                          padding: width < 360 ? "5px" : "8px",
                        }}
                        position={{ x: width < 360 ? 10 : undefined, y: width < 360 ? 10 : undefined }}
                        wrapperStyle={{ zIndex: 100 }}
                      />
                      <Legend
                        layout={width < 480 ? "horizontal" : "vertical"}
                        verticalAlign={width < 480 ? "bottom" : "middle"}
                        align={width < 480 ? "center" : "right"}
                        wrapperStyle={{
                          fontSize: width < 360 ? 10 : 12,
                          paddingLeft: width < 480 ? 0 : 20,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Project summary table */}
              <div className="mt-4 sm:mt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm p-1 sm:p-2">Project</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm p-1 sm:p-2">Time</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm p-1 sm:p-2">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectData.map((project, index) => {
                      const totalSeconds = projectData.reduce((sum, p) => sum + p.totalSeconds, 0)
                      const percentage =
                        totalSeconds > 0 ? ((project.totalSeconds / totalSeconds) * 100).toFixed(1) : "0.0"

                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium py-1 sm:py-2 px-1 sm:px-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div
                                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                                style={{ backgroundColor: colors[index % colors.length] }}
                                aria-hidden="true"
                              />
                              {width < 360 && project.name.length > 10
                                ? `${project.name.substring(0, 10)}...`
                                : project.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-1 sm:py-2 px-1 sm:px-4 text-xs sm:text-sm">
                            {project.formattedTime}
                          </TableCell>
                          <TableCell className="text-right py-1 sm:py-2 px-1 sm:px-4 text-xs sm:text-sm">
                            {percentage}%
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="text-xs sm:text-sm p-1 sm:p-2">Total</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm p-1 sm:p-2">
                        {formatTimeForDisplay(projectData.reduce((sum, p) => sum + p.totalSeconds, 0))}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm p-1 sm:p-2">100%</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

