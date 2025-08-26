"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import { chatAPI, learnAPI } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import {
  Send,
  Bot,
  User,
  Paperclip,
  X,
  FileText,
  BookOpen,
  Target,
  HelpCircle,
  Zap,
  BarChart3,
  Brain,
  TrendingUp,
} from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  files?: File[]
  type?: "text" | "lesson" | "summary" | "flashcards" | "quiz" | "workflow" | "progress"
  lessonData?: any
  summaryData?: string[]
  flashcardData?: Array<{ front: string; back: string }>
  quizData?: Array<{ question: string; options: string[]; answer: string }>
  workflowData?: string[]
}

interface MasteryData {
  user_id: string
  topics: Array<{
    topic: string
    mastery_level: number
    confidence: number
    last_assessed: string
  }>
  overall_progress: number
  strengths: string[]
  areas_for_improvement: string[]
  recommendations: string[]
}

interface UnifiedAIInterfaceProps {
  files: File[]
  selectedLevel: string
  selectedFramework: string
  currentLessonId?: number | null
  conversationId?: string | null
  onConversationIdChange?: (id: string) => void
}

export function UnifiedAIInterface({
  files,
  selectedLevel,
  selectedFramework,
  currentLessonId,
  conversationId,
  onConversationIdChange,
}: UnifiedAIInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [masteryData, setMasteryData] = useState<MasteryData | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const quickActions = [
    {
      id: "summary",
      label: "Summary",
      icon: FileText,
      prompt: "Provide a summary of the uploaded content",
      description: "Get a concise overview",
      color: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    },
    {
      id: "lesson",
      label: "Lesson",
      icon: BookOpen,
      prompt: "Create a lesson plan from this content",
      description: "Generate structured learning",
      color: "bg-green-100 text-green-600 hover:bg-green-200",
    },
    {
      id: "diagnostic",
      label: "Diagnostic",
      icon: Target,
      prompt: "Run a diagnostic assessment",
      description: "Test your knowledge",
      color: "bg-orange-100 text-orange-600 hover:bg-orange-200",
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: HelpCircle,
      prompt: "Generate quiz questions",
      description: "Practice with questions",
      color: "bg-purple-100 text-purple-600 hover:bg-purple-200",
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: Zap,
      prompt: "Create flashcards for key concepts",
      description: "Quick review cards",
      color: "bg-yellow-100 text-yellow-600 hover:bg-yellow-200",
    },
    {
      id: "workflow",
      label: "Workflow",
      icon: BarChart3,
      prompt: "Create a learning workflow",
      description: "Step-by-step process",
      color: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200",
    },
  ]

  // Update uploaded files when files prop changes
  useEffect(() => {
    setUploadedFiles(files)
  }, [files])

  // Load mastery data
  useEffect(() => {
    loadMasteryData()
  }, [user])

  const loadMasteryData = async () => {
    if (!user?.id) {
      setMasteryData({
        user_id: "anonymous",
        topics: [],
        overall_progress: 0,
        strengths: [],
        areas_for_improvement: [],
        recommendations: ["Sign in to track your learning progress"],
      })
      return
    }

    try {
      const data = await learnAPI.getMastery(user.id)
      setMasteryData(data)
    } catch (error) {
      console.error("Failed to load mastery data:", error)
      setMasteryData({
        user_id: user.id,
        topics: [],
        overall_progress: 0,
        strengths: [],
        areas_for_improvement: [],
        recommendations: ["Unable to load progress data. Please try again later."],
      })
    }
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setUploadedFiles([])
    setIsLoading(true)

    try {
      const data = await chatAPI.sendMessage({
        message: inputMessage,
        user_id: user?.id || "anonymous-user",
        explanation_level:
          selectedLevel === "beginner" ? "5_year_old" : selectedLevel === "intermediate" ? "intern" : "senior",
        conversation_id: conversationId || undefined,
      })

      if (data.conversation_id && onConversationIdChange) {
        onConversationIdChange(data.conversation_id)
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help you learn! Ask me anything about your uploaded materials.",
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action: (typeof quickActions)[0]) => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use AI features",
        variant: "destructive",
      })
      return
    }

    // Add user message for the action
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Generate ${action.label.toLowerCase()} for the uploaded content`,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      let response: any = {}

      switch (action.id) {
        case "summary":
          response = await learnAPI.getSummary({
            content: action.prompt,
            user_id: user.id,
          })
          break
        case "diagnostic":
          response = await learnAPI.getDiagnostic({
            topic: "general",
            user_id: user.id,
          })
          break
        case "lesson":
        case "quiz":
        case "flashcards":
        case "workflow":
          response = await learnAPI.generateContent({
            type: action.id,
            topic: action.prompt,
            difficulty: selectedLevel,
            user_id: user.id,
          })
          break
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response || response.summary || `${action.label} generated successfully!`,
        sender: "ai",
        timestamp: new Date(),
        type: action.id as any,
        lessonData: response.lesson_data,
        summaryData: response.summary_data,
        flashcardData: response.flashcard_data,
        quizData: response.quiz_data,
        workflowData: response.workflow_data,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error(`Failed to execute ${action.id}:`, error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Failed to generate ${action.label.toLowerCase()}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".md"),
      )
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const renderProgressOverview = () => {
    if (!masteryData || masteryData.topics.length === 0) return null

    return (
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-xs">
            <span>Overall Progress</span>
            <span>{masteryData.overall_progress}%</span>
          </div>
          <Progress value={masteryData.overall_progress} className="h-1" />

          {masteryData.topics.slice(0, 3).map((topic, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="truncate flex-1">{topic.topic}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {topic.mastery_level}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Progress Overview - only show if user has data */}
      {masteryData && masteryData.topics.length > 0 && renderProgressOverview()}

      {/* Quick Actions - collapsible */}
      {showQuickActions && uploadedFiles.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Quick Actions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowQuickActions(false)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className={`h-auto p-2 flex flex-col items-center gap-1 ${action.color} border-0`}
                    onClick={() => handleQuickAction(action)}
                    disabled={isLoading}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages Area - Fixed height with proper scrolling */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Hello! I'm your unified AI learning assistant. Upload files and ask questions or use quick actions to
                get started.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">Level: {selectedLevel}</Badge>
                <Badge variant="outline">Focus: {selectedFramework}</Badge>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === "user" ? "justify-end" : ""}`}>
              {message.sender === "ai" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                {message.files && message.files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs opacity-75">
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {message.sender === "user" && (
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-green-100 text-green-600">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* File Upload Area */}
      {uploadedFiles.length > 0 && (
        <div className="border-t p-3 bg-muted/30 shrink-0">
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-background rounded px-2 py-1 text-sm">
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-32">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadedFile(index)}
                  className="h-4 w-4 p-0 hover:bg-red-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4 shrink-0">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your learning materials..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
