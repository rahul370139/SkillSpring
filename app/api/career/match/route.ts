import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const answers = searchParams.get("answers")

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock career matches
  const mockCareers = [
    {
      id: "1",
      title: "Software Engineer",
      icon: "💻",
      salaryRange: "$80k - $150k",
      matchScore: 95,
      description: "Build and maintain software applications",
    },
    {
      id: "2",
      title: "Data Scientist",
      icon: "📊",
      salaryRange: "$90k - $160k",
      matchScore: 88,
      description: "Analyze data to drive business decisions",
    },
    {
      id: "3",
      title: "UX Designer",
      icon: "🎨",
      salaryRange: "$70k - $130k",
      matchScore: 82,
      description: "Design user-centered digital experiences",
    },
    {
      id: "4",
      title: "Product Manager",
      icon: "🚀",
      salaryRange: "$100k - $180k",
      matchScore: 78,
      description: "Guide product development and strategy",
    },
    {
      id: "5",
      title: "DevOps Engineer",
      icon: "⚙️",
      salaryRange: "$85k - $155k",
      matchScore: 75,
      description: "Streamline development and deployment processes",
    },
  ]

  return NextResponse.json({ careers: mockCareers })
}
