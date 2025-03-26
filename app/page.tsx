import { TimeTrackerHome } from "@/components/time-tracker-home"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TimeTrack - Timer",
  description: "Track your work hours efficiently",
}

export default function HomePage() {
  return <TimeTrackerHome />
}

