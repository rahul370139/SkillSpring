"use client"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    // Cycle through: light -> blue-dark -> light
    if (theme === "light") {
      setTheme("blue-dark")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all blue-dark:-rotate-90 blue-dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all blue-dark:rotate-0 blue-dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
