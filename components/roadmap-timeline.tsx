"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Circle, Clock, BookOpen, Code, ExternalLink, FolderOpen } from "lucide-react"
import { useState } from "react"

interface RoadmapStep {
  step: number
  title: string
  description: string
  duration: string
  skills: string[]
  resources: string[]
  projects: string[]
}

interface RoadmapTimelineProps {
  steps: RoadmapStep[]
}

export function RoadmapTimeline({ steps }: RoadmapTimelineProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [expandedSteps, setExpandedSteps] = useState<number[]>([])

  const toggleStepCompletion = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber],
    )
  }

  const toggleStepExpansion = (stepNumber: number) => {
    setExpandedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber],
    )
  }

  return (
    <div className="space-y-6">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.step)
        const isExpanded = expandedSteps.includes(step.step)
        const isLast = index === steps.length - 1

        return (
          <div key={step.step} className="relative">
            {/* Timeline Line */}
            {!isLast && <div className="absolute left-6 top-12 w-0.5 h-full bg-border z-0" />}

            <Card
              className={`relative z-10 transition-all duration-200 ${
                isCompleted ? "bg-green-50 border-green-200" : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  {/* Step Circle */}
                  <button onClick={() => toggleStepCompletion(step.step)} className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
                    )}
                  </button>

                  {/* Step Header */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                        Step {step.step}: {step.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {step.duration}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => toggleStepExpansion(step.step)}>
                          {isExpanded ? "Collapse" : "Expand"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2">{step.description}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                  {/* Skills to Learn */}
                  {step.skills.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Skills to Learn
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {step.skills.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {step.resources.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Learning Resources
                      </h4>
                      <div className="space-y-2">
                        {step.resources.map((resource, resourceIndex) => (
                          <div key={resourceIndex} className="flex items-center gap-2 text-sm">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            <span>{resource}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {step.projects.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Practice Projects
                      </h4>
                      <div className="space-y-2">
                        {step.projects.map((project, projectIndex) => (
                          <div key={projectIndex} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span>{project}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )
      })}

      {/* Progress Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Progress</h4>
              <p className="text-sm text-muted-foreground">
                {completedSteps.length} of {steps.length} steps completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {Math.round((completedSteps.length / steps.length) * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
