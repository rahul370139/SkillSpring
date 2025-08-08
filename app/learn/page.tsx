"use client"

import type React from "react"
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
  Palette
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  files?: File[]
  type?: "text" | "file" | "actions"
  // NEW fields for messages of type="actions":
  lesson_id?: number
  actions?: string[]
}

const API = process.env.NEXT_PUBLIC_API_URL!;

/** POST /api/distill  – returns { lesson_id, actions[] } */
async function uploadToDistill(file: File, ownerId: string) {
  const formData = new FormData();
  formData.append("file", file);

  console.log("Uploading to:", `${API}/api/distill?owner_id=${ownerId}`)
  console.log("File:", file.name, "Size:", file.size, "Type:", file.type)

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for Railway cold-start

  try {
    const r = await fetch(`${API}/api/distill?owner_id=${ownerId}`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log("Response status:", r.status)
    
    if (!r.ok) {
      const errorText = await r.text()
      console.error("Upload error:", errorText)
      throw new Error(`${r.status}: ${errorText}`)
    }
    
    const result = await r.json()
    console.log("Upload success:", result)
    return result as Promise<{ lesson_id: number; actions: string[] }>;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Upload timeout. Please try again.")
    }
    throw error;
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const footerFileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

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
    if (!files?.length) return
    const supportedFiles = Array.from(files).filter(f => f.type === "application/pdf")
    if (!supportedFiles.length) {
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
      
      // NOTE: one-file upload for MVP
      const distillResp = await uploadToDistill(supportedFiles[0], user?.id || "anonymous-user")
      
      console.log("Upload successful, response:", distillResp)

      // ① Store file locally
      setUploadedFiles(prev => [...prev, supportedFiles[0]])

      // ② Push a "system" message with action buttons
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: `✅ ${supportedFiles[0].name} uploaded and processed. What would you like to do?`,
          sender: "ai",
          timestamp: new Date(),
          type: "actions",
          files: [],
          lesson_id: distillResp.lesson_id,
          actions: distillResp.actions || ["summary", "lesson", "quiz", "flashcards", "workflow"],
        } as Message & { lesson_id: number; actions: string[] }
      ])
      
      toast({
        title: "File Processed Successfully",
        description: `${supportedFiles[0].name} uploaded and processed. You can now generate summaries, quizzes, and more!`,
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

  // Implement handleActionClick
  const handleActionClick = async (action: string, lessonId: number) => {
    setIsLoading(true)
    
    try {
      const res = await fetch(
        `${API}/api/lesson/${lessonId}/${action}`,
        { method: "GET" }
      )
      if (!res.ok) throw new Error(await res.text())
      const { content } = await res.json()
      
      setMessages((prev: Message[]) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: content || `Generated ${action} for your document.`,
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error(`Failed to generate ${action}:`, error)
      let errorMessage = `Failed to generate ${action}. Please try again.`
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage = `The ${action} feature is not available for this document.`
        } else if (error.message.includes("500")) {
          errorMessage = `Server error while generating ${action}. Please try again later.`
        } else {
          errorMessage = error.message
        }
      }
      toast({
        title: "Generation Failed",
        description: errorMessage,
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
      type: "text"
    }

          setMessages((prev: Message[]) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          user_id: user?.id || "anonymous-user",
          explanation_level: appliedExperienceLevel === "beginner" ? "5_year_old" : appliedExperienceLevel === "intermediate" ? "intern" : appliedExperienceLevel === "expert" ? "senior" : "senior",
          framework: appliedFramework
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm here to help you learn! Ask me anything about your uploaded materials.",
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev: Message[]) => [...prev, aiMessage])
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
    toast({
      title: "Chat cleared",
      description: "All messages have been removed",
    })
  }

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
                            Hello! I'm your AI learning assistant. Upload some files and ask me questions to get started.
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
                        <div key={message.id} className={`flex gap-3 ${message.sender === "user" ? "justify-end" : ""}`}>
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
                            <div className="text-sm prose dark:prose-invert max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                              </ReactMarkdown>
                            </div>

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
                            {/* Render option buttons when type==="actions" */}
                            {message.type === "actions" && message.actions && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {message.actions.map((action) => (
                                  <Button
                                    key={action}
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleActionClick(action, message.lesson_id!)}
                                    disabled={isLoading || isUploading}
                                  >
                                    {action.charAt(0).toUpperCase() + action.slice(1)}
                                  </Button>
                                ))}
                              </div>
                            )}
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
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
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

                  {/* Input Area */}
                  <div className="border-t p-4">
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
                  <p>• Request flashcards and quizzes for practice</p>
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
