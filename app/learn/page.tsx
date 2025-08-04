"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, Settings, Zap, Sparkles, Send, MessageSquare, Trash2, Download } from "lucide-react"
import { ChatInterface } from "@/components/chat-interface"
import { toast } from "@/components/ui/use-toast"

export default function LearnPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [experienceLevel, setExperienceLevel] = useState("intermediate")
  const [framework, setFramework] = useState("general")
  const [appliedExperienceLevel, setAppliedExperienceLevel] = useState("intermediate")
  const [appliedFramework, setAppliedFramework] = useState("general")
  const [isDragOver, setIsDragOver] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).filter(
        (file) => file.type === "application/pdf" || file.type === "text/plain" || file.name.endsWith(".md"),
      )
      setSelectedFiles((prev) => [...prev, ...newFiles])
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

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGenerateLesson = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      toast({
        title: "Lesson Generated!",
        description: "Your micro-lesson has been created based on the uploaded files.",
      })
    }, 2000)
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

        {/* File Upload Section - Made Shorter */}
        <Card className="border shadow-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10 dark:bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5" />
                Upload Learning Materials
              </CardTitle>
              <Button
                onClick={handleGenerateLesson}
                disabled={selectedFiles.length === 0 || isGenerating}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Lesson
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 bg-background/50 ${
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
                  type="file"
                  multiple
                  accept=".pdf,.txt,.md"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                    <span>Choose Files</span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground">Supports PDF, TXT, and Markdown files</p>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Selected Files:</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                <ChatInterface
                  files={selectedFiles}
                  selectedLevel={appliedExperienceLevel}
                  selectedFramework={appliedFramework}
                />
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
                  <Input
                    id="framework"
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    placeholder="e.g., React, Node.js, Python"
                  />
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
                      <Badge variant="default">{selectedFiles.length}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Chat Controls - Properly Fitted */}
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
