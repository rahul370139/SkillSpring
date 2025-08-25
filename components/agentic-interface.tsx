"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Upload,
  Bot,
  User,
  Lightbulb,
  Target,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Award,
  ArrowRight,
  AlertCircle,
  Brain,
  FileText,
  Palette,
  Zap,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { agenticAPI } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LessonDisplay } from "@/components/lesson-display"

interface AgenticInterfaceProps {
  uploadedFiles: File[]
  currentLessonId: number | null
  userId: string
  experienceLevel: string
  framework: string
  onFileUpload: (files: FileList | null) => void
  isUploading: boolean
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

interface AgentMessage {
  id: string
  type: "user" | "agent" | "system"
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  data?: any
  contentType?: "lesson" | "quiz" | "flashcards" | "workflow" | "summary"
  lessonData?: {
    lesson_id: string
    bullets: string[]
    framework: string
    explanation_level: string
  }
  summaryData?: string[]
  flashcardData?: Array<{ front: string; back: string }>
  quizData?: Array<{ question: string; options: string[]; answer: string }>
  workflowData?: string[]
}

interface MasteryData {
  overall_score: number
  topic_scores: Record<string, number>
  skill_breakdown: Record<string, number>
  learning_progress: any
  recommended_topics: string[]
}

interface DiagnosticSession {
  session_id: string
  questions: Array<{
    question: string
    options: string[]
    correct_answer: string
  }>
  mastery_before: MasteryData
  current_question: number
  user_answers: Array<{
    question_index: number
    selected_answer: string
    is_correct: boolean
  }>
}

export function AgenticInterface({
  uploadedFiles,
  currentLessonId,
  userId,
  experienceLevel,
  framework,
  onFileUpload,
  isUploading,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}: AgenticInterfaceProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentIntent, setCurrentIntent] = useState<string | null>(null)
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null)
  const [diagnosticSession, setDiagnosticSession] = useState<DiagnosticSession | null>(null)
  const [isInDiagnostic, setIsInDiagnostic] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Only load mastery data for authenticated users
    if (userId && userId !== "anonymous-user" && userId !== "anonymous") {
      loadMasteryData()
    } else {
      // Set default mastery data for anonymous users
      setMasteryData({
        overall_score: 0,
        topic_scores: {},
        skill_breakdown: {},
        learning_progress: {},
        recommended_topics: ["Sign in to track your learning progress"],
      })
    }
  }, [userId])

  useEffect(() => {
    // Add welcome message when component mounts
    if (messages.length === 0) {
      addMessage(
        "system",
        "Welcome to the Agentic AI Tutor! I'm an intelligent learning system that can provide personalized summaries, run diagnostic assessments, and track your learning progress. Upload a PDF to get started!",
      )
    }
  }, [])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  const loadMasteryData = async () => {
    try {
      const data = await agenticAPI.getMastery(userId)
      setMasteryData(data.mastery)
    } catch (error) {
      console.warn("Failed to load mastery data:", error)
      // Set default mastery data if API fails
      setMasteryData({
        overall_score: 0,
        topic_scores: {},
        skill_breakdown: {},
        learning_progress: {},
        recommended_topics: ["Complete assessments to track your progress"],
      })
    }
  }

  const addMessage = (type: "user" | "agent" | "system", content: string, data?: any) => {
    const message: AgentMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      data,
    }
    setMessages((prev) => [...prev, message])
    return message
  }

  // Process agentic response data similar to chat interface
  const processAgenticResponse = (data: any, contentType?: string): boolean => {
    console.log("🔍 Processing agentic response:", JSON.stringify(data, null, 2))

    const payload = data?.data ?? data
    const responseText = payload?.response || payload?.summary || ""

    // Handle different content types
    if (contentType === "lesson" || payload?.lesson_data || payload?.bullets) {
      const lessonData = payload?.lesson_data || payload
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          timestamp: new Date(),
          contentType: "lesson",
          content: "Generated lesson content:",
          lessonData: {
            lesson_id: String(lessonData?.lesson_id || currentLessonId || ""),
            bullets: lessonData?.bullets || lessonData?.key_points || [],
            framework: lessonData?.framework || framework,
            explanation_level: lessonData?.explanation_level || experienceLevel,
          },
        },
      ])
      return true
    }

    if (contentType === "quiz" || payload?.quiz || payload?.questions) {
      const quizData = payload?.quiz || payload?.questions || []
      const normalizedQuiz = quizData.map((item: any, index: number) => ({
        question: item?.question || item?.q || `Question ${index + 1}`,
        options: item?.options || item?.choices || [`Option A`, `Option B`, `Option C`, `Option D`],
        answer: item?.answer || item?.correct || "A",
      }))

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          timestamp: new Date(),
          contentType: "quiz",
          content: "Generated quiz questions:",
          quizData: normalizedQuiz,
        },
      ])
      return true
    }

    if (contentType === "flashcards" || payload?.flashcards || payload?.cards) {
      const flashcardData = payload?.flashcards || payload?.cards || []
      const normalizedFlashcards = flashcardData.map((item: any, index: number) => ({
        front: item?.front || item?.question || `Question ${index + 1}`,
        back: item?.back || item?.answer || `Answer ${index + 1}`,
      }))

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          timestamp: new Date(),
          contentType: "flashcards",
          content: "Generated flashcards:",
          flashcardData: normalizedFlashcards,
        },
      ])
      return true
    }

    if (contentType === "workflow" || payload?.workflow || payload?.steps) {
      const workflowSteps = payload?.workflow || payload?.steps || []
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          timestamp: new Date(),
          contentType: "workflow",
          content: workflowSteps.join("\n\n"),
          workflowData: workflowSteps,
        },
      ])
      return true
    }

    if (contentType === "summary" || payload?.summary || payload?.key_points) {
      const summaryData =
        payload?.key_points || (Array.isArray(payload?.summary) ? payload.summary : [payload?.summary])
      const md = summaryData.map((pt: string) => `- **${pt}**`).join("\n")
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "agent",
          timestamp: new Date(),
          contentType: "summary",
          content: md,
          summaryData: summaryData,
        },
      ])
      return true
    }

    // Fallback to plain text
    if (responseText) {
      addMessage("agent", responseText, payload)
      return true
    }

    return false
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = addMessage("user", inputMessage)
    const originalMessage = inputMessage
    setInputMessage("")
    setIsLoading(true)

    try {
      // Step 1: Route the message to determine intent
      const routeResponse = await agenticAPI.routeMessage({
        message: originalMessage,
        pdf_id: currentLessonId?.toString(),
        user_id: userId,
      })

      console.log("Route response:", routeResponse)
      setCurrentIntent(routeResponse.intent)

      // Add agent response about intent
      addMessage("agent", routeResponse.message, {
        intent: routeResponse.intent,
        confidence: routeResponse.confidence,
        suggestions: routeResponse.suggestions,
      })

      // Step 2: Execute based on intent
      if (routeResponse.intent === "summary" && currentLessonId) {
        await handleSummaryRequest(originalMessage)
      } else if (routeResponse.intent === "diagnostic" && currentLessonId) {
        await handleDiagnosticRequest(originalMessage)
      } else if (routeResponse.intent === "clarify") {
        // Already handled by the route response
      } else {
        addMessage(
          "system",
          "I understand you want help, but I need a PDF uploaded first to provide personalized assistance.",
        )
      }
    } catch (error) {
      console.error("Error processing message:", error)
      addMessage("system", "Sorry, I encountered an error processing your request. Please try again.")
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummaryRequest = async (originalMessage: string) => {
    try {
      const summaryResponse = await agenticAPI.generateSummary({
        pdf_id: currentLessonId!.toString(),
        user_id: userId,
        topic: extractTopicFromMessage(originalMessage),
      })

      console.log("Summary response:", summaryResponse)

      // Format summary for display
      let summaryContent = "## 📝 Document Summary\n\n"
      summaryContent += summaryResponse.summary + "\n\n"

      if (summaryResponse.key_points && summaryResponse.key_points.length > 0) {
        summaryContent += "### Key Points:\n"
        summaryResponse.key_points.forEach((point: string, index: number) => {
          summaryContent += `${index + 1}. **${point}**\n`
        })
        summaryContent += "\n"
      }

      if (summaryResponse.concept_map) {
        summaryContent += "### Concept Relationships:\n"
        summaryContent += "The document covers interconnected concepts that build upon each other.\n\n"
      }

      addMessage("agent", summaryContent, summaryResponse)
    } catch (error) {
      console.error("Error generating summary:", error)
      addMessage("system", "Failed to generate summary. Please try again.")
    }
  }

  const handleDiagnosticRequest = async (originalMessage: string) => {
    try {
      const diagnosticResponse = await agenticAPI.startDiagnostic({
        pdf_id: currentLessonId!.toString(),
        user_id: userId,
        topic: extractTopicFromMessage(originalMessage),
        num: 10,
      })

      console.log("Diagnostic response:", diagnosticResponse)

      setDiagnosticSession({
        session_id: diagnosticResponse.session_id,
        questions: diagnosticResponse.questions,
        mastery_before: diagnosticResponse.mastery_before,
        current_question: 0,
        user_answers: [],
      })

      setIsInDiagnostic(true)

      addMessage(
        "agent",
        `## 🎯 Diagnostic Assessment Started\n\nI've prepared ${diagnosticResponse.questions.length} questions to assess your understanding. This will help me identify your strengths and areas for improvement.\n\n**Estimated Duration:** ${diagnosticResponse.estimated_duration}\n\nLet's begin!`,
        diagnosticResponse,
      )
    } catch (error) {
      console.error("Error starting diagnostic:", error)
      addMessage("system", "Failed to start diagnostic assessment. Please try again.")
    }
  }

  const handleDiagnosticAnswer = async (questionIndex: number, selectedAnswer: string) => {
    if (!diagnosticSession) return

    const question = diagnosticSession.questions[questionIndex]
    const isCorrect = selectedAnswer === question.correct_answer

    const updatedAnswers = [
      ...diagnosticSession.user_answers,
      {
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      },
    ]

    const updatedSession = {
      ...diagnosticSession,
      current_question: questionIndex + 1,
      user_answers: updatedAnswers,
    }

    setDiagnosticSession(updatedSession)

    // Add user's answer to chat
    addMessage("user", `Question ${questionIndex + 1}: ${selectedAnswer}`)

    // Provide immediate feedback
    const feedback = isCorrect
      ? "✅ Correct! Well done."
      : `❌ Not quite. The correct answer is: ${question.correct_answer}`

    addMessage("agent", feedback)

    // Check if diagnostic is complete
    if (updatedSession.current_question >= diagnosticSession.questions.length) {
      await completeDiagnostic(updatedSession)
    }
  }

  const completeDiagnostic = async (session: DiagnosticSession) => {
    try {
      setIsLoading(true)

      const resultsResponse = await agenticAPI.processDiagnosticResults({
        pdf_id: currentLessonId!.toString(),
        user_id: userId,
        session_id: session.session_id,
        user_answers: session.user_answers,
      })

      console.log("Diagnostic results:", resultsResponse)

      // Format results for display
      let resultsContent = "## 📊 Diagnostic Results\n\n"

      const correctAnswers = session.user_answers.filter((a) => a.is_correct).length
      const totalQuestions = session.user_answers.length
      const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100)

      resultsContent += `**Score:** ${correctAnswers}/${totalQuestions} (${scorePercentage}%)\n\n`

      if (resultsResponse.results.skill_gaps && resultsResponse.results.skill_gaps.length > 0) {
        resultsContent += "### Areas for Improvement:\n"
        resultsResponse.results.skill_gaps.forEach((gap: string) => {
          resultsContent += `• ${gap}\n`
        })
        resultsContent += "\n"
      }

      if (resultsResponse.results.recommendations && resultsResponse.results.recommendations.length > 0) {
        resultsContent += "### Recommendations:\n"
        resultsResponse.results.recommendations.forEach((rec: string) => {
          resultsContent += `• ${rec}\n`
        })
        resultsContent += "\n"
      }

      if (resultsResponse.results.next_steps && resultsResponse.results.next_steps.length > 0) {
        resultsContent += "### Next Steps:\n"
        resultsResponse.results.next_steps.forEach((step: string, index: number) => {
          resultsContent += `${index + 1}. ${step}\n`
        })
      }

      addMessage("agent", resultsContent, resultsResponse.results)

      // Update mastery data
      await loadMasteryData()

      // Reset diagnostic state
      setIsInDiagnostic(false)
      setDiagnosticSession(null)
    } catch (error) {
      console.error("Error processing diagnostic results:", error)
      addMessage("system", "Failed to process diagnostic results. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const extractTopicFromMessage = (message: string): string => {
    // Simple topic extraction - could be enhanced with NLP
    const topicKeywords = ["about", "on", "regarding", "concerning", "related to"]
    const lowerMessage = message.toLowerCase()

    for (const keyword of topicKeywords) {
      const index = lowerMessage.indexOf(keyword)
      if (index !== -1) {
        const afterKeyword = message.substring(index + keyword.length).trim()
        const words = afterKeyword.split(" ").slice(0, 3) // Take first 3 words
        return words.join(" ")
      }
    }

    return ""
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Quick action handlers for agentic interface
  const handleQuickAction = async (action: string) => {
    if (!currentLessonId) {
      toast({
        title: "No Document",
        description: "Please upload a PDF first to use quick actions.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Add user message to show what button was clicked
    const actionMessages = {
      summary: "Please provide a comprehensive summary of the uploaded document",
      lesson: "Create a structured lesson from the PDF content",
      diagnostic: "I'd like to take a diagnostic test to assess my understanding",
      quiz: "Generate quiz questions from the PDF content",
      flashcards: "Create flashcards from the PDF content",
      workflow: "Create a workflow diagram from the PDF content",
      mastery: "Show me my current mastery levels and progress",
    }

    const userPrompt = actionMessages[action as keyof typeof actionMessages] || `Generate ${action} from the PDF`
    addMessage("user", userPrompt)

    try {
      if (action === "summary") {
        await handleSummaryRequest(userPrompt)
      } else if (action === "diagnostic") {
        await handleDiagnosticRequest(userPrompt)
      } else if (action === "mastery") {
        await loadMasteryData()
        if (masteryData) {
          let masteryContent = "## 📊 Your Learning Progress\n\n"
          masteryContent += `**Overall Mastery:** ${Math.round(masteryData.overall_score * 100)}%\n\n`

          if (Object.keys(masteryData.topic_scores).length > 0) {
            masteryContent += "### Topic Scores:\n"
            Object.entries(masteryData.topic_scores).forEach(([topic, score]) => {
              masteryContent += `• **${topic}:** ${Math.round((score as number) * 100)}%\n`
            })
            masteryContent += "\n"
          }

          if (masteryData.recommended_topics.length > 0) {
            masteryContent += "### Recommended Focus Areas:\n"
            masteryData.recommended_topics.forEach((topic) => {
              masteryContent += `• ${topic}\n`
            })
          }

          addMessage("agent", masteryContent, masteryData)
        }
      } else {
        // Handle other content generation (lesson, quiz, flashcards, workflow)
        const contentResponse = await agenticAPI.generateContent({
          pdf_id: currentLessonId.toString(),
          user_id: userId,
          content_type: action as "lesson" | "quiz" | "flashcards" | "workflow",
          difficulty: experienceLevel,
        })

        console.log(`${action} response:`, contentResponse)
        processAgenticResponse(contentResponse, action)
      }
    } catch (error) {
      console.error(`Failed to generate ${action}:`, error)
      addMessage("system", `Failed to generate ${action}. Please try again.`)
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${action}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeUploadedFile = (index: number) => {
    // This would need to be handled by the parent component
    console.log("Remove file at index:", index)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {uploadedFiles.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Agentic AI Tutor</h3>
              <p className="text-muted-foreground mb-4">
                I'm your intelligent tutoring system. I can analyze your learning needs, provide personalized summaries,
                and run diagnostic assessments.
              </p>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 bg-background/50 max-w-md mx-auto ${
                  isDragOver
                    ? "border-primary bg-primary/5 scale-105"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30"
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Upload a PDF to get started</p>
                    <p className="text-sm text-muted-foreground">I'll analyze it and provide intelligent tutoring</p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => onFileUpload(e.target.files)}
                    className="hidden"
                    id="agentic-file-upload"
                  />
                  <Label htmlFor="agentic-file-upload">
                    <Button variant="outline" className="cursor-pointer bg-transparent" asChild disabled={isUploading}>
                      <span>Choose PDF File</span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          )}

          {uploadedFiles.length > 0 && messages.length <= 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">PDF Ready for Analysis</span>
              </div>

              {masteryData && (
                <Card className="max-w-md mx-auto">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Your Learning Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Mastery</span>
                      <Badge variant="secondary">{Math.round(masteryData.overall_score * 100)}%</Badge>
                    </div>
                    <Progress value={masteryData.overall_score * 100} className="h-2" />

                    {masteryData.recommended_topics.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">Recommended Focus Areas:</span>
                        <div className="flex flex-wrap gap-1">
                          {masteryData.recommended_topics.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("summary")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Summary
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("lesson")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <Brain className="h-3 w-3 mr-1" />
                  Lesson
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("diagnostic")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <Target className="h-3 w-3 mr-1" />
                  Diagnostic
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("quiz")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Quiz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("flashcards")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Flashcards
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("workflow")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <Palette className="h-3 w-3 mr-1" />
                  Workflow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction("mastery")}
                  className="bg-transparent"
                  disabled={isLoading}
                >
                  <Award className="h-3 w-3 mr-1" />
                  Progress
                </Button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : ""}`}>
              {message.type !== "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={
                      message.type === "agent"
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }
                  >
                    {message.type === "agent" ? (
                      <Lightbulb className="h-4 w-4" />
                    ) : message.type === "system" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : message.type === "agent"
                      ? "bg-purple-50 dark:bg-purple-950/20 text-purple-900 dark:text-purple-100"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {/* Render different content types */}
                {message.contentType === "lesson" && message.lessonData ? (
                  <div className="mt-3">
                    <LessonDisplay lesson={message.lessonData} />
                  </div>
                ) : (
                  <div className="text-sm prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                )}

                {message.data?.intent && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Intent: {message.data.intent}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(message.data.confidence * 100)}% confident
                    </Badge>
                  </div>
                )}

                {message.data?.suggestions && message.data.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-xs font-medium">Suggestions:</span>
                    {message.data.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="text-xs opacity-75">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {message.type === "user" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* Diagnostic Question Display */}
          {isInDiagnostic &&
            diagnosticSession &&
            diagnosticSession.current_question < diagnosticSession.questions.length && (
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Diagnostic Question {diagnosticSession.current_question + 1} of{" "}
                      {diagnosticSession.questions.length}
                    </CardTitle>
                    <Badge variant="outline">
                      {Math.round((diagnosticSession.current_question / diagnosticSession.questions.length) * 100)}%
                    </Badge>
                  </div>
                  <Progress
                    value={(diagnosticSession.current_question / diagnosticSession.questions.length) * 100}
                    className="h-2"
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="font-medium">
                    {diagnosticSession.questions[diagnosticSession.current_question].question}
                  </div>
                  <div className="grid gap-2">
                    {diagnosticSession.questions[diagnosticSession.current_question].options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="justify-start text-left h-auto p-3 bg-transparent"
                        onClick={() => handleDiagnosticAnswer(diagnosticSession.current_question, option)}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {(isLoading || isUploading) && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                  <Lightbulb className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    {isUploading ? "Processing document..." : "Analyzing and thinking..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions Bar (when file is uploaded) */}
      {uploadedFiles.length > 0 && !isInDiagnostic && (
        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("summary")}
              disabled={isLoading}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Summary
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("lesson")}
              disabled={isLoading}
            >
              <Brain className="h-3 w-3 mr-1" /> Lesson
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("diagnostic")}
              disabled={isLoading}
            >
              <Target className="h-3 w-3 mr-1" /> Diagnostic
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("quiz")}
              disabled={isLoading}
            >
              <Zap className="h-3 w-3 mr-1" /> Quiz
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("flashcards")}
              disabled={isLoading}
            >
              <FileText className="h-3 w-3 mr-1" /> Flashcards
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("workflow")}
              disabled={isLoading}
            >
              <Palette className="h-3 w-3 mr-1" /> Workflow
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => handleQuickAction("mastery")}
              disabled={isLoading}
            >
              <Award className="h-3 w-3 mr-1" /> Progress
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              uploadedFiles.length === 0
                ? "Upload a PDF first to start learning..."
                : isInDiagnostic
                  ? "Answer the question above to continue..."
                  : "Ask for a summary, request a diagnostic test, or ask questions..."
            }
            className="flex-1"
            disabled={isLoading || isInDiagnostic || uploadedFiles.length === 0}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim() || isInDiagnostic || uploadedFiles.length === 0}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
