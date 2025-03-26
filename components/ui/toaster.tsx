"use client"

import { ToastProvider, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { CustomToast } from "@/components/ui/custom-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, duration, ...props }) => (
        <CustomToast
          key={id}
          title={title}
          description={description}
          action={action}
          duration={duration}
          onDismiss={() => dismiss(id)}
          {...props}
        />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

