const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

// Chat API functions
export const chatAPI = {
  sendMessage: async (data: {
    message: string
    user_id: string
    conversation_id?: string
    explanation_level?: string
    framework?: string
    lesson_id?: number | null
    context?: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Chat API error: ${response.status}`)
    return response.json()
  },

  uploadFile: async (file: File, userId: string, conversationId?: string, explanationLevel?: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("user_id", userId)
    if (conversationId) formData.append("conversation_id", conversationId)
    if (explanationLevel) formData.append("explanation_level", explanationLevel)

    const response = await fetch(`${API_BASE_URL}/api/chat/upload`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error(`Upload API error: ${response.status}`)
    return response.json()
  },

  ingestDistilled: async (
    lessonId: string,
    userId: string,
    options?: {
      conversation_id?: string
      explanation_level?: string
      framework?: string
    },
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/ingest-distilled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_id: lessonId,
        user_id: userId,
        ...options,
      }),
    })
    if (!response.ok) throw new Error(`Ingest API error: ${response.status}`)
    return response.json()
  },

  getUserConversations: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${userId}`)
    if (!response.ok) throw new Error(`Conversations API error: ${response.status}`)
    return response.json()
  },
}

// Learn API functions
export const learnAPI = {
  distill: async (file: File, ownerId: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("owner_id", ownerId)

    const response = await fetch(`${API_BASE_URL}/api/distill`, {
      method: "POST",
      body: formData,
    })
    if (!response.ok) throw new Error(`Distill API error: ${response.status}`)
    return response.json()
  },

  getLessonContentForChat: async (lessonId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/lessons/${lessonId}/content?user_id=${userId}`)
    if (!response.ok) throw new Error(`Lesson content API error: ${response.status}`)
    return response.json()
  },
}

// Agentic API functions
export const agenticAPI = {
  // Intent routing
  routeMessage: async (data: {
    message: string
    pdf_id?: string
    user_id: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Route API error: ${response.status}`)
    return response.json()
  },

  // Summary generation
  generateSummary: async (data: {
    pdf_id: string
    user_id: string
    topic?: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Summary API error: ${response.status}`)
    return response.json()
  },

  // Diagnostic testing
  startDiagnostic: async (data: {
    pdf_id: string
    user_id: string
    topic?: string
    num?: number
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/diagnostic/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Diagnostic API error: ${response.status}`)
    return response.json()
  },

  processDiagnosticResults: async (data: {
    pdf_id: string
    user_id: string
    session_id: string
    user_answers: Array<{
      question_index: number
      selected_answer: string
      is_correct: boolean
    }>
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/diagnostic/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Diagnostic results API error: ${response.status}`)
    return response.json()
  },

  // Mastery tracking
  getMastery: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/mastery/${userId}`)
    if (!response.ok) throw new Error(`Mastery API error: ${response.status}`)
    return response.json()
  },

  updateMastery: async (data: {
    user_id: string
    topic: string
    score: number
    skill_data?: Record<string, any>
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/mastery/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Update mastery API error: ${response.status}`)
    return response.json()
  },

  // Content generation
  generateContent: async (data: {
    pdf_id: string
    user_id: string
    content_type: "lesson" | "quiz" | "flashcards" | "workflow"
    topic?: string
    difficulty?: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Content generation API error: ${response.status}`)
    return response.json()
  },

  // Personalized recommendations
  getRecommendations: async (data: {
    user_id: string
    pdf_id?: string
    learning_style?: string
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Recommendations API error: ${response.status}`)
    return response.json()
  },

  // Learning path optimization
  optimizePath: async (data: {
    user_id: string
    current_mastery: Record<string, number>
    target_skills: string[]
  }) => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/optimize-path`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Path optimization API error: ${response.status}`)
    return response.json()
  },

  // System health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/api/agentic/health`)
    if (!response.ok) throw new Error(`Health check API error: ${response.status}`)
    return response.json()
  },
}
