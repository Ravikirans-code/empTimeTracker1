"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  breakpoints?: {
    xs?: string // < 480px
    sm?: string // >= 480px
    md?: string // >= 768px
    lg?: string // >= 1024px
    xl?: string // >= 1280px
  }
}

export function ResponsiveContainer({ children, className, breakpoints = {} }: ResponsiveContainerProps) {
  const [screenSize, setScreenSize] = useState<string>("xs")

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width >= 1280) {
        setScreenSize("xl")
      } else if (width >= 1024) {
        setScreenSize("lg")
      } else if (width >= 768) {
        setScreenSize("md")
      } else if (width >= 480) {
        setScreenSize("sm")
      } else {
        setScreenSize("xs")
      }
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Determine which classes to apply based on current screen size
  let responsiveClasses = ""

  if (breakpoints.xs && screenSize === "xs") {
    responsiveClasses = breakpoints.xs
  } else if (breakpoints.sm && (screenSize === "sm" || screenSize === "xs")) {
    responsiveClasses = breakpoints.sm
  } else if (breakpoints.md && (screenSize === "md" || screenSize === "sm" || screenSize === "xs")) {
    responsiveClasses = breakpoints.md
  } else if (
    breakpoints.lg &&
    (screenSize === "lg" || screenSize === "md" || screenSize === "sm" || screenSize === "xs")
  ) {
    responsiveClasses = breakpoints.lg
  } else if (breakpoints.xl) {
    responsiveClasses = breakpoints.xl
  }

  return <div className={cn(className, responsiveClasses)}>{children}</div>
}

