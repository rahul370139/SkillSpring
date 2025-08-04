"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CareerStepper } from "@/components/career-stepper"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@supabase/auth-helpers-react"

const questions = [
  {
    id: 1,
    question: "I enjoy working with technology and solving technical problems",
    type: "likert",
  },
  {
    id: 2,
    question: "I prefer working independently rather than in large teams",
    type: "likert",
  },
  {
    id: 3,
    question: "I like analyzing data to find patterns and insights",
    type: "likert",
  },
  {
    id: 4,
    question: "I enjoy creating visual designs and user interfaces",
    type: "likert",
  },
  {
    id: 5,
    question: "I'm comfortable presenting ideas to groups of people",
    type: "likert",
  },
  {
    id: 6,
    question: "I prefer structured, predictable work environments",
    type: "likert",
  },
  {
    id: 7,
    question: "I enjoy mentoring and helping others learn",
    type: "likert",
  },
  {
    id: 8,
    question: "I like working on long-term strategic projects",
    type: "likert",
  },
  {
    id: 9,
    question: "I'm energized by fast-paced, changing environments",
    type: "likert",
  },
  {
    id: 10,
    question: "I prefer hands-on, practical work over theoretical concepts",
    type: "likert",
  },
]

const likertOptions = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" },
]

interface Career {
  career: string
  description: string
  match_score: number
}

export default function CareerDiscoverPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [careers, setCareers] = useState<Career[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const session = useSession()

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = async () => {
    if (currentStep === questions.length) {
      if (!session?.user.id) {
        alert("Please sign in to get your career matches")
        return
      }

      // Submit and get results
      setIsLoading(true)
      try {
        const response = await fetch("https://trainbackend-production.up.railway.app/api/career-pathfinder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: session.user.id,
            answers: Object.entries(answers).map(([question_id, rating]) => ({
              question_id: Number.parseInt(question_id),
              rating: Number.parseInt(rating),
            })),
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get career matches")
        }

        const data = await response.json()
        setCareers(data.career_matches || [])
        setShowResults(true)
      } catch (error) {
        console.error("Failed to get career matches:", error)
        alert("Failed to get career matches. Please try again.")
      } finally {
        setIsLoading(false)
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const handleViewProfile = (careerId: string) => {
    // Navigate to career profile or show modal
    console.log("View profile for career:", careerId)
  }

  const canGoNext = answers[currentStep] !== undefined

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Analyzing Your Responses...</h1>
          <p className="text-muted-foreground">Finding the best career matches for you</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Career Matches</h1>
          <p className="text-muted-foreground">
            Based on your responses, here are the careers that align with your interests and preferences.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {careers.map((career, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💼</span>
                    <div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {career.career}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{career.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">{career.match_score}%</span>
                    <p className="text-xs text-muted-foreground">Match</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => handleViewProfile(career.career)}>
                  View Career Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              setShowResults(false)
              setCurrentStep(1)
              setAnswers({})
              setCareers([])
            }}
          >
            Take Assessment Again
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentStep - 1]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Career Pathfinder</h1>
        <p className="text-muted-foreground">
          Answer these questions to discover careers that match your interests and work style.
        </p>
      </div>

      <CareerStepper
        currentStep={currentStep}
        totalSteps={questions.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext}
      />

      <Card>
        <CardHeader>
          <CardTitle>Question {currentStep}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">{currentQuestion.question}</p>

          <RadioGroup
            value={answers[currentStep] || ""}
            onValueChange={(value) => handleAnswerChange(currentStep, value)}
          >
            {likertOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}
