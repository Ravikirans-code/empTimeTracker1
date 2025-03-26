"use client"

import { useState, useEffect } from "react"

type ScreenSize = "xs" | "sm" | "md" | "lg" | "xl"

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<ScreenSize>("md")
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)

  useEffect(() => {
    // Function to update screen size
    const updateSize = () => {
      const width = window.innerWidth
      setWidth(width)
      setHeight(window.innerHeight)

      if (width < 480) {
        setScreenSize("xs")
      } else if (width < 768) {
        setScreenSize("sm")
      } else if (width < 1024) {
        setScreenSize("md")
      } else if (width < 1280) {
        setScreenSize("lg")
      } else {
        setScreenSize("xl")
      }
    }

    // Set size on mount
    if (typeof window !== "undefined") {
      updateSize()

      // Add event listener
      window.addEventListener("resize", updateSize)

      // Clean up
      return () => window.removeEventListener("resize", updateSize)
    }
  }, [])

  return {
    screenSize,
    width,
    height,
    isXs: screenSize === "xs",
    isSm: screenSize === "sm",
    isMd: screenSize === "md",
    isLg: screenSize === "lg",
    isXl: screenSize === "xl",
    isMobile: screenSize === "xs" || screenSize === "sm",
    isTablet: screenSize === "md",
    isDesktop: screenSize === "lg" || screenSize === "xl",
  }
}

