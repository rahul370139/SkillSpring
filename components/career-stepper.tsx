"use client"

import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CareerStepperProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  canGoNext: boolean
}

export function CareerStepper({ currentStep, totalSteps, onNext, onPrevious, canGoNext }: CareerStepperProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{Math.round(progress)}% complete</span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={currentStep === 1}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <Button onClick={onNext} disabled={!canGoNext}>
          {currentStep === totalSteps ? "Get Results" : "Next"}
          {currentStep !== totalSteps && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  )
}
