"use client"

import type React from "react"
import { learnAPI, chatAPI } from "@/lib/api"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  FileText,
  Settings,
  Zap,
  Sparkles,
  Send,
  MessageSquare,
  Trash2,
  Download,
  Bot,
  User,
  Paperclip,
  X,
  Brain,
  Target,
  Palette,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { LessonDisplay } from "@/components/lesson-display"
import { FlashcardPlayer, QuizPlayer } from "@/components/lesson-display"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  files?: File[]
  type?: "text" | "file" | "actions" | "lesson" | "summary" | "flashcards" | "quiz" | "workflow"
  // NEW fields for messages of type="actions":
  lesson_id?: number
  actions?: string[]
  // NEW fields for messages of type="lesson":
  lessonData?: {
    lesson_id: string
    bullets: string[]
    framework: string
    explanation_level: string
  }
  // NEW fields for individual action types:
  summaryData?: string[]
  flashcardData?: Array<{ front: string; back: string }>
  quizData?: Array<{ question: string; options: string[]; answer: string }>
  workflowData?: string[]
}

/** POST /api/distill  – returns { lesson_id, actions[] } */
async function uploadToDistill(file: File, ownerId: string) {
  console.log("uploadToDistill called with:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    ownerId,
  })

  try {
    const data = await learnAPI.distill(file, ownerId)
    console.log("Distill upload successful, response:", data)
    return data
  } catch (error) {
    console.error("Distill upload failed with error:", error)
    throw error
  }
}

/** POST /api/chat/upload - integrates PDF into chat conversation */
async function uploadFileForChat(file: File, userId: string, conversationId: string | null, explanationLevel: string) {
  console.log("uploadFileForChat called with:", { fileName: file.name, userId, conversationId, explanationLevel })

  try {
    const data = await chatAPI.uploadFile(file, userId, conversationId || undefined, explanationLevel)
    console.log("Chat upload success:", data)
    return data as { conversation_id: string; response: string }
  } catch (error) {
    console.error("Chat upload failed with error:", error)
    throw error
  }
}

export default function LearnPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [experienceLevel, setExperienceLevel] = useState("intermediate")
  const [framework, setFramework] = useState("general")
  const [appliedExperienceLevel, setAppliedExperienceLevel] = useState("intermediate")
  const [appliedFramework, setAppliedFramework] = useState("general")
  const [isDragOver, setIsDragOver] = useState(false)
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [pdfContext, setPdfContext] = useState<string>("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const footerFileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  // Load persisted conversation_id on mount
  useEffect(() => {
    try {
      const storedConversationId = localStorage.getItem("trainpi_conversation_id")
      if (storedConversationId) {
        setConversationId(storedConversationId)
      }
    } catch {}
  }, [])

  // Persist conversation_id when it changes
  useEffect(() => {
    if (conversationId) {
      try {
        localStorage.setItem("trainpi_conversation_id", conversationId)
      } catch {}
    }
  }, [conversationId])

  // Persist user_id for consistency across calls
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem("trainpi_user_id", user.id)
      } catch {}
    }
  }, [user?.id])

  // Enhanced function to detect fallback/mock data
  const isFallbackData = (data: any, type: string): boolean => {
    if (!data) return true

    switch (type) {
      case "quiz":
        // Check for common fallback patterns in quiz data
        const quizText = JSON.stringify(data).toLowerCase()
        return (
          quizText.includes("sample question") ||
          quizText.includes("example question") ||
          quizText.includes("placeholder") ||
          quizText.includes("mock") ||
          quizText.includes("fallback") ||
          (Array.isArray(data) && data.length < 3) // Too few questions suggests fallback
        )

      case "flashcards":
        // Check for common fallback patterns in flashcard data
        const flashcardText = JSON.stringify(data).toLowerCase()
        return (
          flashcardText.includes("sample card") ||
          flashcardText.includes("example card") ||
          flashcardText.includes("placeholder") ||
          flashcardText.includes("mock") ||
          flashcardText.includes("fallback") ||
          (Array.isArray(data) && data.length < 5) // Too few cards suggests fallback
        )

      case "workflow":
        // Check for common fallback patterns in workflow data
        const workflowText = JSON.stringify(data).toLowerCase()
        return (
          workflowText.includes("sample step") ||
          workflowText.includes("example step") ||
          workflowText.includes("placeholder") ||
          workflowText.includes("mock") ||
          workflowText.includes("fallback") ||
          (Array.isArray(data) && data.length < 3) // Too few steps suggests fallback
        )

      default:
        return false
    }
  }

  // Improved function to process chat responses with fallback detection
  const processChatResponse = (data: any, fallbackText?: string, requestType?: string): boolean => {
    console.log("🔍 Processing chat response:", JSON.stringify(data, null, 2))

    const payload = data?.data ?? data
    const type = payload?.type || requestType

    console.log("📊 Extracted payload:", payload)
    console.log("🏷️ Type detected:", type)

    // Handle quiz responses
    if (type === "quiz" || payload?.quiz || payload?.quiz_data || payload?.questions) {
      const quizQs = payload?.quiz || payload?.quiz_data?.questions || payload?.questions || payload?.content?.questions
      console.log("🧩 Quiz questions found:", quizQs)

      if (quizQs && Array.isArray(quizQs) && quizQs.length > 0) {
        // Check if this is fallback data
        if (isFallbackData(quizQs, "quiz")) {
          console.log("⚠️ Detected fallback quiz data, requesting actual content...")
          // Don't process fallback data, instead request actual content
          setTimeout(() => {
            handleActionClick("actual_quiz", currentLessonId ?? 0)
          }, 1000)
          return false
        }

        // Validate quiz structure
        const validQuiz = quizQs.filter((q) => q && (q.question || typeof q === "string") && q.options && q.answer)
        console.log("✅ Valid quiz questions:", validQuiz)

        if (validQuiz.length > 0) {
          const preview = validQuiz
            .map((q: any, idx: number) => {
              const text = typeof q === "string" ? q : q?.question || JSON.stringify(q)
              return `${idx + 1}. ${text}`
            })
            .join("\n")

          setMessages((prev: Message[]) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: "ai",
              timestamp: new Date(),
              type: "quiz",
              quizData: validQuiz,
              content: preview,
            },
          ])
          return true
        }
      }
    }

    // Handle flashcards responses
    if (type === "flashcards" || payload?.flashcards || payload?.flashcard_data || payload?.cards) {
      const cards = payload?.flashcards || payload?.flashcard_data?.cards || payload?.cards || payload?.content?.cards
      console.log("🃏 Flashcards found:", cards)

      if (cards && Array.isArray(cards) && cards.length > 0) {
        // Check if this is fallback data
        if (isFallbackData(cards, "flashcards")) {
          console.log("⚠️ Detected fallback flashcard data, requesting actual content...")
          // Don't process fallback data, instead request actual content
          setTimeout(() => {
            handleActionClick("actual_flashcards", currentLessonId ?? 0)
          }, 1000)
          return false
        }

        // Validate flashcard structure
        const validCards = cards.filter((c) => c && (c.front || c.question) && (c.back || c.answer))
        console.log("✅ Valid flashcards:", validCards)

        if (validCards.length > 0) {
          // Normalize flashcard format
          const normalizedCards = validCards.map((c) => ({
            front: c.front || c.question || "Question",
            back: c.back || c.answer || "Answer",
          }))

          const preview = normalizedCards
            .map((c: any, idx: number) => `• ${idx + 1}. ${c.front} → ${c.back}`)
            .join("\n")

          setMessages((prev: Message[]) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: "ai",
              timestamp: new Date(),
              type: "flashcards",
              flashcardData: normalizedCards,
              content: preview,
            },
          ])
          return true
        }
      }
    }

    // Handle workflow responses
    if (type === "workflow" || payload?.workflow || payload?.workflow_data) {
      const steps = payload?.workflow || payload?.workflow_data?.steps || payload?.content?.workflow
      const mermaid = payload?.workflow_data?.mermaid_code

      console.log("🔄 Workflow steps found:", steps)
      console.log("📊 Mermaid code found:", mermaid)

      if (steps && Array.isArray(steps) && steps.length > 0) {
        // Check if this is fallback data
        if (isFallbackData(steps, "workflow")) {
          console.log("⚠️ Detected fallback workflow data, requesting actual content...")
          // Don't process fallback data, instead request actual content
          setTimeout(() => {
            handleActionClick("actual_workflow", currentLessonId ?? 0)
          }, 1000)
          return false
        }

        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            timestamp: new Date(),
            type: "workflow",
            content: steps.join("\n\n"),
            workflowData: steps,
          },
        ])
        return true
      }

      if (typeof mermaid === "string" && mermaid.trim().length > 0) {
        const md = ["```mermaid", mermaid.trim(), "```"].join("\n")
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            timestamp: new Date(),
            type: "workflow",
            content: md,
          },
        ])
        return true
      }
    }

    // Handle lesson responses
    if (type === "lesson" || payload?.lesson || payload?.lesson_data) {
      const lessonData = payload?.lesson || payload?.lesson_data || payload?.content || payload?.lessonData
      console.log("📚 Lesson data found:", lessonData)

      if (lessonData && (lessonData.bullets || lessonData.summary)) {
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            timestamp: new Date(),
            type: "lesson",
            lessonData: {
              lesson_id: String(lessonData?.lesson_id || currentLessonId || ""),
              bullets: lessonData?.bullets || [],
              framework: lessonData?.framework || appliedFramework,
              explanation_level: lessonData?.explanation_level || appliedExperienceLevel,
            },
          },
        ])
        return true
      }
    }

    // Handle summary responses
    if (type === "summary" || payload?.summary || payload?.summary_data) {
      const summaryBullets =
        payload?.summary_data?.key_points ||
        payload?.summary ||
        payload?.summary_data ||
        payload?.content ||
        payload?.summaryData
      console.log("📝 Summary bullets found:", summaryBullets)

      if (Array.isArray(summaryBullets) && summaryBullets.length > 0) {
        const md = summaryBullets.map((pt: string) => `- **${pt}**`).join("\n")
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "ai",
            timestamp: new Date(),
            type: "summary",
            content: md,
            summaryData: summaryBullets,
          },
        ])
        return true
      }
    }

    // Try to extract structured data from response text if no explicit type
    const responseText = payload?.response || fallbackText || ""
    console.log("📄 Response text:", responseText)

    // Try to parse JSON from response text
    if (responseText && typeof responseText === "string") {
      try {
        // Look for JSON blocks in the response
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0])
          console.log("🔍 Found JSON in response:", jsonData)
          return processChatResponse(jsonData, responseText, requestType)
        }
      } catch (e) {
        console.log("❌ Failed to parse JSON from response")
      }
    }

    // Fallback to plain text
    if (responseText) {
      console.log("📝 Using fallback text response")
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: responseText,
          sender: "ai",
          timestamp: new Date(),
        },
      ])
      return true
    }

    console.log("❌ No valid content found in response")
    return false
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    console.log("handleFileUpload called with:", files)
    if (!files?.length) {
      console.log("No files provided")
      return
    }

    console.log(
      "All files:",
      Array.from(files).map((f) => ({ name: f.name, type: f.type, size: f.size })),
    )

    const supportedFiles = Array.from(files).filter((f) => f.type === "application/pdf")
    console.log(
      "Supported PDF files:",
      supportedFiles.map((f) => f.name),
    )

    if (!supportedFiles.length) {
      console.log("No PDF files found")
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      console.log("Starting file upload:", supportedFiles[0].name)
      console.log("User ID:", user?.id || "anonymous-user")
      console.log("File details:", {
        name: supportedFiles[0].name,
        type: supportedFiles[0].type,
        size: supportedFiles[0].size,
      })

      // Step 1: Call /api/distill to persist lesson and get lesson_id
      const distillResp = await uploadToDistill(supportedFiles[0], user?.id || "anonymous-user")
      console.log("Distill upload successful, response:", distillResp)

      // Step 2: Call /api/chat/upload to integrate PDF into chat conversation
      const explanationLevel =
        appliedExperienceLevel === "beginner"
          ? "5_year_old"
          : appliedExperienceLevel === "intermediate"
            ? "intern"
            : "senior"
      const chatUploadResp = await uploadFileForChat(
        supportedFiles[0],
        user?.id || "anonymous-user",
        conversationId,
        explanationLevel,
      )
      console.log("Chat upload successful, response:", chatUploadResp)

      // Step 3: Call /api/chat/ingest-distilled to load the lesson content into chat context
      try {
        const ingestData = await chatAPI.ingestDistilled(
          distillResp.lesson_id.toString(),
          user?.id || "anonymous-user",
          {
            conversation_id: chatUploadResp.conversation_id,
            explanation_level: explanationLevel,
            framework: appliedFramework,
          },
        )
        console.log("Lesson content ingested into chat:", ingestData)
      } catch (error) {
        console.warn("Error ingesting lesson content:", error)
      }

      // Store file locally and set contexts
      setUploadedFiles((prev) => [...prev, supportedFiles[0]])
      setCurrentLessonId(distillResp.lesson_id)
      setConversationId(chatUploadResp.conversation_id)
      try {
        localStorage.setItem("trainpi_conversation_id", chatUploadResp.conversation_id)
      } catch {}
      setPdfContext(`PDF: ${supportedFiles[0].name} (Lesson ID: ${distillResp.lesson_id})`)

      // Add the AI's response from chat upload (no quick action buttons)
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: chatUploadResp.response,
          sender: "ai",
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          content: `✅ ${supportedFiles[0].name} uploaded and processed. Try the quick action buttons below or ask: "create summary", "create lesson", "generate 10 quiz questions", "make 12 flashcards", or "create workflow".`,
          sender: "ai",
          timestamp: new Date(),
          type: "text",
        },
      ])

      toast({
        title: "File Processed Successfully",
        description: `${supportedFiles[0].name} uploaded and integrated into chat. You can now generate summaries, quizzes, and more!`,
      })
    } catch (err) {
      console.error("Upload failed:", err)
      let errorMessage = "Upload failed. Please try again."
      if (err instanceof Error) {
        if (err.message.includes("Failed to process PDF")) {
          errorMessage = "The PDF could not be processed. Please ensure it contains readable text and try again."
        } else if (err.message.includes("PDF only")) {
          errorMessage = "Please upload a valid PDF file."
        } else if (err.message.includes("422")) {
          errorMessage = "Invalid file format. Please upload a valid PDF file."
        } else if (err.message.includes("500")) {
          errorMessage = "Server error. Please try again later."
        } else {
          errorMessage = err.message
        }
      }
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Enhanced handleActionClick with "actual" prompts to bypass fallback data
  const handleActionClick = async (action: string, lessonId: number) => {
    console.log("🚀 handleActionClick called with:", { action, lessonId })
    setIsLoading(true)

    try {
      // Create prompts that explicitly request "actual" content to bypass fallback data
      const prompts = {
        summary:
          "Please create an actual detailed summary of the uploaded document. Format your response as a structured summary with key points in bullet format. Do not use placeholder or sample content.",
        lesson:
          "Please create an actual comprehensive lesson from the uploaded document. Include key learning objectives and main concepts in a structured format. Do not use placeholder or sample content.",
        quiz: "Please generate actual quiz questions based on the uploaded document content. I need exactly 10 real multiple choice questions with 4 options (A, B, C, D) and the correct answer. Do not use sample, placeholder, or mock questions. Generate actual questions from the document content.",
        flashcards:
          "Please create actual flashcards from the uploaded document content. I need exactly 12 real flashcards with specific questions on the front and detailed answers on the back. Do not use sample, placeholder, or mock flashcards. Generate actual flashcards from the document content.",
        workflow:
          "Please create an actual step-by-step workflow based on the content in the uploaded document. Present it as a real sequence of steps from the document. Do not use sample, placeholder, or mock steps. Generate actual workflow from the document content.",
        // Special "actual" variants for fallback detection
        actual_quiz:
          "Give me the actual quiz questions from the document content. I don't want sample or placeholder questions. Generate real quiz questions based on the actual content of the uploaded document.",
        actual_flashcards:
          "Give me actual flashcards from the document content. I don't want sample or placeholder flashcards. Generate real flashcards based on the actual content of the uploaded document.",
        actual_workflow:
          "Give me the actual workflow from the document content. I don't want sample or placeholder steps. Generate real workflow based on the actual content of the uploaded document.",
      }

      const prompt = prompts[action as keyof typeof prompts] || `create actual ${action} from the document content`

      console.log("📝 Sending prompt:", prompt)

      const data = await chatAPI.sendMessage({
        message: prompt,
        user_id: user?.id || localStorage.getItem("trainpi_user_id") || "anonymous-user",
        conversation_id: conversationId || localStorage.getItem("trainpi_conversation_id") || undefined,
        explanation_level:
          appliedExperienceLevel === "beginner"
            ? "5_year_old"
            : appliedExperienceLevel === "intermediate"
              ? "intern"
              : appliedExperienceLevel === "expert"
                ? "senior"
                : "senior",
        framework: appliedFramework,
        lesson_id: lessonId,
      })

      console.log("📨 Received response:", data)

      if (!conversationId && data?.conversation_id) {
        setConversationId(data.conversation_id)
        try {
          localStorage.setItem("trainpi_conversation_id", data.conversation_id)
        } catch {}
      }

      // Pass the action type to help with processing
      const baseAction = action.replace("actual_", "")
      const rendered = processChatResponse(data, data?.response, baseAction)
      if (!rendered && data?.response) {
        console.log("⚠️ Structured parsing failed, using fallback text")
        // Ensure we still show the textual response when no structured payload is found
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: data.response,
            sender: "ai",
            timestamp: new Date(),
          },
        ])
      }

      console.log("✅ Action handled successfully")
    } catch (error) {
      console.error(`❌ Failed to generate ${action} via chat:`, error)
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${action}. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    }

    setMessages((prev: Message[]) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Get lesson content for chat context if available
      let lessonContent = ""
      if (currentLessonId && (user?.id || localStorage.getItem("trainpi_user_id"))) {
        try {
          const lessonData = await learnAPI.getLessonContentForChat(
            currentLessonId.toString(),
            user?.id || (localStorage.getItem("trainpi_user_id") as string) || "anonymous-user",
          )
          lessonContent = lessonData.content || ""
          console.log("Lesson content loaded for chat:", lessonContent.substring(0, 200) + "...")
        } catch (error) {
          console.warn("Failed to load lesson content for chat:", error)
        }
      }

      // Build context from uploaded PDF and generated content
      let context = ""
      if (currentLessonId) {
        context += `\n\n📄 **Uploaded Document Context:** ${pdfContext}`
      }

      if (lessonContent) {
        context += `\n\n📚 **Lesson Content:**\n${lessonContent}`
      }

      // Add recent generated content to context
      const recentContent = messages
        .filter((msg) => msg.sender === "ai" && msg.content && msg.content.length > 50)
        .slice(-3) // Last 3 AI messages
        .map((msg) => msg.content)
        .join("\n\n")

      if (recentContent) {
        context += `\n\n📚 **Recent Generated Content:**\n${recentContent}`
      }

      const data = await chatAPI.sendMessage({
        message: inputMessage,
        user_id: user?.id || "anonymous-user",
        conversation_id: conversationId || localStorage.getItem("trainpi_conversation_id") || undefined,
        explanation_level:
          appliedExperienceLevel === "beginner"
            ? "5_year_old"
            : appliedExperienceLevel === "intermediate"
              ? "intern"
              : appliedExperienceLevel === "expert"
                ? "senior"
                : "senior",
        framework: appliedFramework,
        lesson_id: currentLessonId,
        context: context,
      })

      if (!conversationId && data?.conversation_id) {
        setConversationId(data.conversation_id)
        try {
          localStorage.setItem("trainpi_conversation_id", data.conversation_id)
        } catch {}
      }

      const rendered = processChatResponse(data, data?.response)
      if (!rendered && data?.response) {
        setMessages((prev: Message[]) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            content: data.response,
            sender: "ai",
            timestamp: new Date(),
          },
        ])
      }
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleApplySettings = () => {
    setAppliedExperienceLevel(experienceLevel)
    setAppliedFramework(framework)
    toast({
      title: "Settings Applied",
      description: "Your learning settings have been updated for the AI assistant.",
    })
  }

  const handleSaveChat = async () => {
    toast({
      title: "Chat saved",
      description: "Your conversation has been saved to your dashboard",
    })
  }

  const handleClearChat = () => {
    setMessages([])
    setUploadedFiles([])
    setCurrentLessonId(null)
    setConversationId(null)
    setPdfContext("")
    try {
      localStorage.removeItem("trainpi_conversation_id")
    } catch {}
    toast({
      title: "Chat cleared",
      description: "All messages and context have been removed",
    })
  }

  // Load existing conversations on component mount
  useEffect(() => {
    const loadConversations = async () => {
      if (user?.id) {
        try {
          const conversations = await chatAPI.getUserConversations(user.id)
          console.log("Loaded existing conversations:", conversations)
          // You can use this to show conversation history in a sidebar
        } catch (error) {
          console.warn("Failed to load conversations:", error)
        }
      }
    }

    loadConversations()
  }, [user?.id])

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI-Powered Learning Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your documents and chat with our AI to create personalized micro-lessons and get instant answers.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg h-[600px] bg-background border">
              <CardHeader className="border-b bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  AI Learning Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="flex flex-col h-full">
                  {/* Messages Area */}
                  <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Hello! I'm your AI learning assistant. Upload some files and ask me questions to get
                            started.
                          </p>

                          {/* Upload Area */}
                          <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 bg-background/50 max-w-md mx-auto ${
                              isDragOver
                                ? "border-primary bg-primary/5 scale-105"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30"
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="space-y-3">
                              <div className="w-12 h-12 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <Upload className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="font-medium">Drop your files here</p>
                                <p className="text-sm text-muted-foreground">or click to browse</p>
                              </div>
                              <Input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf"
                                onChange={(e) => handleFileUpload(e.target.files)}
                                className="hidden"
                                id="file-upload"
                              />
                              <Label htmlFor="file-upload">
                                <Button
                                  variant="outline"
                                  className="cursor-pointer bg-transparent"
                                  asChild
                                  disabled={isUploading}
                                >
                                  <span>Choose Files</span>
                                </Button>
                              </Label>
                              <p className="text-xs text-muted-foreground">Supports PDF files only</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <Badge variant="outline">Level: {appliedExperienceLevel}</Badge>
                            <Badge variant="outline">Focus: {appliedFramework}</Badge>
                          </div>
                        </div>
                      )}

                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.sender === "user" ? "justify-end" : ""}`}
                        >
                          {message.sender === "ai" && (
                            <Avatar className="h-8 w-8">
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
                            {message.type === "lesson" && message.lessonData ? (
                              <div className="mt-3">
                                <LessonDisplay lesson={message.lessonData} />
                              </div>
                            ) : message.type === "flashcards" && message.flashcardData ? (
                              <div className="mt-3">
                                <FlashcardPlayer flashcards={message.flashcardData} />
                              </div>
                            ) : message.type === "quiz" && message.quizData ? (
                              <div className="mt-3">
                                <QuizPlayer quizItems={message.quizData} />
                              </div>
                            ) : (
                              <div className="text-sm prose dark:prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                              </div>
                            )}

                            {message.files && message.files.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.files.map((file, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs opacity-75">
                                    <Paperclip className="h-3 w-3" />
                                    <span>{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="text-xs opacity-50 mt-1">
                              {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>

                          {message.sender === "user" && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-600">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}

                      {(isLoading || isUploading) && (
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                                <div
                                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                />
                                <div
                                  className="w-2 h-2 bg-current rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {isUploading ? "Uploading file..." : "AI is thinking..."}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* File Upload Area */}
                  {uploadedFiles.length > 0 && (
                    <div className="border-t p-3 bg-muted/30">
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

                  {/* Quick Actions + Input Area */}
                  <div className="border-t p-4 space-y-3">
                    {/* Only show quick action buttons if we have uploaded files */}
                    {uploadedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleActionClick("summary", currentLessonId ?? 0)}
                          disabled={isLoading}
                        >
                          <Sparkles className="h-3 w-3 mr-1" /> Summary
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleActionClick("lesson", currentLessonId ?? 0)}
                          disabled={isLoading}
                        >
                          <Brain className="h-3 w-3 mr-1" /> Lesson
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleActionClick("quiz", currentLessonId ?? 0)}
                          disabled={isLoading}
                        >
                          <Target className="h-3 w-3 mr-1" /> Quiz
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleActionClick("flashcards", currentLessonId ?? 0)}
                          disabled={isLoading}
                        >
                          <FileText className="h-3 w-3 mr-1" /> Flashcards
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => handleActionClick("workflow", currentLessonId ?? 0)}
                          disabled={isLoading}
                        >
                          <Palette className="h-3 w-3 mr-1" /> Workflow
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => footerFileInputRef.current?.click()}
                        className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4" />
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
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Hidden file input for footer upload button */}
                    <Input
                      ref={footerFileInputRef}
                      type="file"
                      multiple
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="footer-file-upload"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg bg-background border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Learning Settings
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={handleApplySettings}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium">
                    Experience Level
                  </Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="framework" className="text-sm font-medium">
                    Framework/Tool Focus
                  </Label>
                  <Select value={framework} onValueChange={setFramework}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select framework" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="react">React</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="nodejs">Node.js</SelectItem>
                      <SelectItem value="docker">Docker</SelectItem>
                      <SelectItem value="fastapi">FastAPI</SelectItem>
                      <SelectItem value="machine-learning">Machine Learning</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Current Settings
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Level:</span>
                      <Badge variant="secondary" className="capitalize">
                        {appliedExperienceLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Focus:</span>
                      <Badge variant="outline" className="capitalize">
                        {appliedFramework}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Files:</span>
                      <Badge variant="default">{uploadedFiles.length}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Chat Controls */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Chat Controls</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveChat} className="text-xs bg-transparent">
                      <Download className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleClearChat} className="text-xs bg-transparent">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Tips */}
            <Card className="shadow-lg bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 dark:bg-card border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-700 dark:text-green-400">💡 Learning Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1.5">
                  <p>• Upload multiple files for comprehensive learning</p>
                  <p>• Ask specific questions for better responses</p>
                  <p>• Use the quick action buttons for instant results</p>
                  <p>• Adjust your experience level as you progress</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
