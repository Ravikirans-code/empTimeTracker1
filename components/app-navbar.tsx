"use client"

import { Clock, History, BarChart3 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { name: "Timer", icon: Clock, path: "/" },
    { name: "History", icon: History, path: "/history" },
    { name: "Reports", icon: BarChart3, path: "/reports" },
  ]

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-2 sm:px-4">
        <nav className="flex items-center justify-between h-14">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-lg sm:text-xl font-bold">TimeTrack</h1>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => router.push(item.path)}
                variant={pathname === item.path ? "default" : "ghost"}
                size="sm"
                className="h-9"
              >
                <item.icon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{item.name}</span>
              </Button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}

