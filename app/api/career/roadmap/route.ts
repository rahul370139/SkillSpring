import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get("role")

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Mock roadmap data
  const mockRoadmap = {
    role: role || "Software Engineer",
    milestones: [
      {
        id: "1",
        level: "Foundational",
        title: "Programming Basics",
        estimatedHours: 120,
        lessons: [
          { id: "1", title: "Variables and Data Types", completed: true, hours: 8 },
          { id: "2", title: "Control Structures", completed: true, hours: 12 },
          { id: "3", title: "Functions and Scope", completed: false, hours: 10 },
          { id: "4", title: "Object-Oriented Programming", completed: false, hours: 15 },
        ],
      },
      {
        id: "2",
        level: "Intermediate",
        title: "Web Development",
        estimatedHours: 200,
        lessons: [
          { id: "5", title: "HTML & CSS Fundamentals", completed: false, hours: 20 },
          { id: "6", title: "JavaScript ES6+", completed: false, hours: 25 },
          { id: "7", title: "React Framework", completed: false, hours: 30 },
          { id: "8", title: "API Integration", completed: false, hours: 18 },
        ],
      },
      {
        id: "3",
        level: "Advanced",
        title: "System Design & Architecture",
        estimatedHours: 150,
        lessons: [
          { id: "9", title: "Database Design", completed: false, hours: 25 },
          { id: "10", title: "Microservices Architecture", completed: false, hours: 30 },
          { id: "11", title: "Performance Optimization", completed: false, hours: 20 },
          { id: "12", title: "Security Best Practices", completed: false, hours: 22 },
        ],
      },
    ],
  }

  return NextResponse.json(mockRoadmap)
}
