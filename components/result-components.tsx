"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  FileText,
  BookOpen,
  Brain,
  Workflow,
  Target,
  Download,
  Share,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react"

// Flashcards Component
interface FlashcardData {
  front: string
  back: string
}

interface FlashcardsComponentProps {
  flashcards: FlashcardData[]
  onAction?: (action: string) => void
}

export function FlashcardsComponent({ flashcards, onAction }: FlashcardsComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    setIsFlipped(false)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
      <CardHeader className="text-center bg-purple-100 dark:bg-purple-900/30 rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
          <Brain className="h-6 w-6" />
          Flashcards - Card {currentIndex + 1} of {flashcards.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div
          className="relative h-64 bg-white dark:bg-gray-900 rounded-xl border-2 border-purple-200 dark:border-purple-800 cursor-pointer transition-all duration-500 hover:shadow-xl transform hover:scale-[1.02] perspective-1000"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of card */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 backface-hidden ${isFlipped ? "opacity-0" : "opacity-100"}`}
          >
            <div className="text-center">
              <Badge variant="outline" className="mb-4 bg-purple-100 text-purple-700">
                Front
              </Badge>
              <p className="text-xl font-medium leading-relaxed text-center">{flashcards[currentIndex].front}</p>
            </div>
            <div className="absolute bottom-4 right-4">
              <Eye className="h-5 w-5 text-purple-400" />
            </div>
          </div>

          {/* Back of card */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center p-6 backface-hidden ${isFlipped ? "opacity-100" : "opacity-0"}`}
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="text-center">
              <Badge variant="outline" className="mb-4 bg-green-100 text-green-700">
                Back
              </Badge>
              <p className="text-xl font-medium leading-relaxed text-center">{flashcards[currentIndex].back}</p>
            </div>
            <div className="absolute bottom-4 right-4">
              <EyeOff className="h-5 w-5 text-green-400" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Click the card to flip • Use arrows to navigate</p>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={prevCard} disabled={flashcards.length <= 1} size="lg">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onAction?.("download")}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction?.("share")}>
              <Share className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={nextCard} disabled={flashcards.length <= 1} size="lg">
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        <Progress value={((currentIndex + 1) / flashcards.length) * 100} className="h-3" />
      </CardContent>
    </Card>
  )
}

// Quiz Component
interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface QuizComponentProps {
  questions: QuizQuestion[]
  onAction?: (action: string) => void
}

export function QuizComponent({ questions, onAction }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(new Array(questions.length).fill(""))
  const [showResults, setShowResults] = useState(false)

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answer
    setSelectedAnswers(newAnswers)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(questions.length).fill(""))
    setShowResults(false)
  }

  const correctAnswers = selectedAnswers.filter((answer, index) => answer === questions[index].answer).length
  const score = Math.round((correctAnswers / questions.length) * 100)

  if (showResults) {
    return (
      <Card className="w-full max-w-3xl mx-auto border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader className="text-center bg-green-100 dark:bg-green-900/30 rounded-t-lg">
          <CardTitle className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
            <Target className="h-6 w-6" />
            Quiz Complete! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-green-600 mb-2">{score}%</div>
            <p className="text-lg text-muted-foreground">
              You scored {correctAnswers} out of {questions.length} questions correctly!
            </p>
            <Badge variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"} className="mt-2">
              {score >= 80 ? "Excellent!" : score >= 60 ? "Good Job!" : "Keep Learning!"}
            </Badge>
          </div>

          <Progress value={score} className="h-4 bg-gray-200" />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Review Your Answers:</h3>
            {questions.map((q, index) => (
              <Card
                key={index}
                className={`p-4 ${selectedAnswers[index] === q.answer ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-red-300 bg-red-50 dark:bg-red-950/20"}`}
              >
                <div className="flex items-start gap-3">
                  {selectedAnswers[index] === q.answer ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mt-1 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mt-1 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium mb-2">
                      Q{index + 1}: {q.question}
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Your answer:</span>
                        <Badge variant={selectedAnswers[index] === q.answer ? "default" : "destructive"}>
                          {selectedAnswers[index] || "Not answered"}
                        </Badge>
                      </div>
                      {selectedAnswers[index] !== q.answer && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Correct answer:</span>
                          <Badge variant="default" className="bg-green-600">
                            {q.answer}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={resetQuiz} variant="outline" size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
            <Button onClick={() => onAction?.("download")} variant="outline" size="lg">
              <Download className="h-4 w-4 mr-2" />
              Download Results
            </Button>
            <Button onClick={() => onAction?.("share")} variant="outline" size="lg">
              <Share className="h-4 w-4 mr-2" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardHeader className="bg-blue-100 dark:bg-blue-900/30 rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Target className="h-6 w-6" />
            Quiz Question {currentQuestion + 1} of {questions.length}
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <Card className="p-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border-l-4 border-blue-500">
          <p className="text-lg font-medium leading-relaxed">{questions[currentQuestion].question}</p>
        </Card>

        <div className="space-y-3">
          <h4 className="font-semibold text-muted-foreground">Choose your answer:</h4>
          {questions[currentQuestion].options.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswers[currentQuestion] === option ? "default" : "outline"}
              className={`w-full justify-start text-left h-auto p-4 transition-all duration-200 ${
                selectedAnswers[currentQuestion] === option
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                  : "hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300"
              }`}
              onClick={() => handleAnswerSelect(option)}
            >
              <div className="flex items-center gap-4 w-full">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    selectedAnswers[currentQuestion] === option
                      ? "border-white bg-white text-blue-600"
                      : "border-blue-300 text-blue-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="flex-1 text-base">{option}</span>
              </div>
            </Button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            size="lg"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex-1 mx-6">
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-3" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          <Button
            onClick={nextQuestion}
            disabled={!selectedAnswers[currentQuestion]}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {currentQuestion === questions.length - 1 ? "Finish Quiz" : "Next Question"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Summary Component
interface SummaryComponentProps {
  summary: string
  keyPoints?: string[]
  onAction?: (action: string) => void
}

export function SummaryComponent({ summary, keyPoints, onAction }: SummaryComponentProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Document Summary
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onAction?.("copy")}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction?.("download")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm leading-relaxed">{summary}</p>
        </div>

        {keyPoints && keyPoints.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Key Points
              </h4>
              <ul className="space-y-2">
                {keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Workflow Component
interface WorkflowComponentProps {
  workflow: string
  onAction?: (action: string) => void
}

export function WorkflowComponent({ workflow, onAction }: WorkflowComponentProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-indigo-600" />
            Learning Workflow
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onAction?.("copy")}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction?.("download")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono">{workflow}</pre>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          This workflow diagram shows the recommended learning path for your content.
        </div>
      </CardContent>
    </Card>
  )
}

// Lesson Component
interface LessonComponentProps {
  lesson: any
  onAction?: (action: string) => void
}

export function LessonComponent({ lesson, onAction }: LessonComponentProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Structured Lesson
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onAction?.("copy")}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAction?.("download")}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-500">
          <h3 className="font-semibold mb-2">Learning Objectives</h3>
          <p className="text-sm text-muted-foreground">
            Master the key concepts and apply them effectively in real-world scenarios.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Lesson Content</h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm leading-relaxed">
              {typeof lesson === "string" ? lesson : JSON.stringify(lesson, null, 2)}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Estimated time: 15-20 minutes</span>
          <Badge variant="outline">Beginner Friendly</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
