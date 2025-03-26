"use client"

import * as React from "react"
import { Toast, ToastClose, ToastDescription, ToastTitle } from "@/components/ui/toast"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CustomToastProps extends React.ComponentPropsWithoutRef<typeof Toast> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  onDismiss?: () => void
}

export function CustomToast({
  title,
  description,
  action,
  duration = 5000,
  onDismiss,
  className,
  ...props
}: CustomToastProps) {
  const [progress, setProgress] = React.useState(100)
  const [timeLeft, setTimeLeft] = React.useState(duration)

  React.useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      const newProgress = (remaining / duration) * 100

      setTimeLeft(remaining)
      setProgress(newProgress)

      if (remaining <= 0 && onDismiss) {
        onDismiss()
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onDismiss])

  return (
    <Toast className={cn("relative overflow-hidden", className)} {...props}>
      <div className="grid gap-1">
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
      <Progress value={progress} className="absolute bottom-0 left-0 right-0 h-1 rounded-none bg-transparent" />
    </Toast>
  )
}

