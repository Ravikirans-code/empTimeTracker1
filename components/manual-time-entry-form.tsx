"use client"
import { format } from "date-fns"
import { Plus } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

interface ManualTimeEntryFormProps {
  projects: Project[]
  onAddEntry: (entry: TimeEntry) => void
}

// Update the schema to include seconds
const formSchema = z.object({
  projectId: z.string({
    required_error: "Please select a project",
  }),
  description: z.string().optional(),
  date: z.date({
    required_error: "Please select a date",
  }),
  hours: z.coerce.number().min(0).max(24),
  minutes: z.coerce.number().min(0).max(59),
  seconds: z.coerce.number().min(0).max(59),
})

export function ManualTimeEntryForm({ projects, onAddEntry }: ManualTimeEntryFormProps) {
  // Update the form default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      description: "",
      date: new Date(),
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
  })

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
    form.reset({
      projectId: "",
      description: "",
      date: new Date(),
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Manual Time Entry</CardTitle>
        <p className="text-sm text-muted-foreground">Add time for work you've already completed</p>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="What did you work on?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minutes</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="59" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seconds</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="59" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full flex items-center gap-2" disabled={!form.formState.isValid}>
              <Plus className="h-4 w-4" />
              Add Time Entry
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

