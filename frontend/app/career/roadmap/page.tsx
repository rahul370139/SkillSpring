"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RoadmapTimeline } from "@/components/roadmap-timeline"
import { Target, Clock, BookOpen, Award, TrendingUp, Download, Share, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface RoadmapStep {
  step: number
  title: string
  description: string
  duration: string
  skills: string[]
  resources: string[]
  projects: string[]
}

interface RoadmapData {
  career_title: string
  total_duration: string
  difficulty_level: string
  steps: RoadmapStep[]
  milestones: Array<{
    title: string
    description: string
    timeline: string
  }>
}

function RoadmapPageContent() {
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const careerParam = searchParams.get("career")
    if (careerParam) {
      try {
        const careerData = JSON.parse(decodeURIComponent(careerParam))
        generateRoadmap(careerData)
      } catch (error) {
        console.error("Failed to parse career data:", error)
        setError("Invalid career data")
      }
    }
  }, [searchParams])

  const generateRoadmap = async (careerData: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("https://trainbackend-production.up.railway.app/api/roadmap-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          career_title: careerData.title,
          current_skills: careerData.selectedSkills || [],
          interests: careerData.interests || [],
          experience_level: "beginner",
          time_commitment: "10-15 hours/week",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate roadmap")
      }

      const data = await response.json()
      setRoadmapData(data)
    } catch (error) {
      console.error("Failed to generate roadmap:", error)
      setError("Failed to generate roadmap. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadRoadmap = () => {
    if (!roadmapData) return

    const roadmapText = `
# ${roadmapData.career_title} Learning Roadmap

**Duration:** ${roadmapData.total_duration}
**Difficulty:** ${roadmapData.difficulty_level}

## Steps:
${roadmapData.steps
  .map(
    (step) => `
### Step ${step.step}: ${step.title}
**Duration:** ${step.duration}
**Description:** ${step.description}

**Skills to Learn:**
${step.skills.map((skill) => `- ${skill}`).join("\n")}

**Resources:**
${step.resources.map((resource) => `- ${resource}`).join("\n")}

**Projects:**
${step.projects.map((project) => `- ${project}`).join("\n")}
`,
  )
  .join("\n")}

## Milestones:
${roadmapData.milestones
  .map(
    (milestone) => `
### ${milestone.title}
**Timeline:** ${milestone.timeline}
**Description:** ${milestone.description}
`,
  )
  .join("\n")}
    `

    const blob = new Blob([roadmapText], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${roadmapData.career_title.replace(/\s+/g, "_")}_roadmap.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h1 className="text-3xl font-bold">Generating Your Roadmap...</h1>
          <p className="text-muted-foreground">Our AI is creating a personalized learning path for you</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-destructive">Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!roadmapData) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">No Roadmap Data</h1>
          <p className="text-muted-foreground">Please select a career from the pathfinder to generate a roadmap</p>
          <Button onClick={() => router.push("/career")}>Go to Career Pathfinder</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {roadmapData.career_title} Roadmap
        </h1>
        <p className="text-muted-foreground text-lg">
          Your personalized learning journey to become a {roadmapData.career_title}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Duration</h3>
            <p className="text-2xl font-bold text-primary">{roadmapData.total_duration}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Difficulty</h3>
            <p className="text-2xl font-bold text-primary capitalize">{roadmapData.difficulty_level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold">Steps</h3>
            <p className="text-2xl font-bold text-primary">{roadmapData.steps.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button onClick={handleDownloadRoadmap}>
          <Download className="h-4 w-4 mr-2" />
          Download Roadmap
        </Button>
        <Button variant="outline">
          <Share className="h-4 w-4 mr-2" />
          Share Roadmap
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Careers
        </Button>
      </div>

      {/* Roadmap Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RoadmapTimeline steps={roadmapData.steps} />
        </CardContent>
      </Card>

      {/* Milestones */}
      {roadmapData.milestones && roadmapData.milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Key Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {roadmapData.milestones.map((milestone, index) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold">{milestone.title}</h4>
                <p className="text-sm text-muted-foreground mb-1">{milestone.timeline}</p>
                <p className="text-sm">{milestone.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        </div>
      }
    >
      <RoadmapPageContent />
    </Suspense>
  )
}
