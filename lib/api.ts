// Centralized API service for TrainPI backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://trainbackend-production.up.railway.app"

// Generic API call helper
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error)
    throw error
  }
}

// Health & Debug Endpoints
export const healthAPI = {
  check: () => apiCall<{ status: string }>("/health"),
  test: () => apiCall<{ message: string }>("/api/test"),
  debugLesson: (lessonId: string) => apiCall<any>(`/api/debug/lesson/${lessonId}`),
}

// Learn Page Endpoints
export const learnAPI = {
  // PDF Processing & Lesson Management
  distill: (file: File, ownerId: string) => {
    const formData = new FormData()
    formData.append("file", file)

    return fetch(`${API_BASE_URL}/api/distill?owner_id=${ownerId}`, {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(`Distill failed: ${res.status}`)
      return res.json()
    })
  },

  getLessonContent: (lessonId: string, action: string) => apiCall<any>(`/api/lesson/${lessonId}/${action}`),

  generateLessonContent: (lessonId: string, action: string, data: any) =>
    apiCall<any>(`/api/lesson/${lessonId}/${action}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLessonSummary: (data: any) =>
    apiCall<any>("/api/chat/lesson/summary", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLessonContentForChat: (lessonId: string, userId: string) =>
    apiCall<any>(`/api/chat/lesson/${lessonId}/content?user_id=${encodeURIComponent(userId)}`),

  // Framework & Skills
  getFrameworks: () => apiCall<string[]>("/api/frameworks"),
  getSkills: () => apiCall<string[]>("/api/skills"),
  getExplanationLevels: () => apiCall<string[]>("/api/explanation-levels"),
  getLessonsByFramework: (framework: string) => apiCall<any[]>(`/api/lessons/framework/${framework}`),

  // Micro Lessons
  getMicroLessons: () => apiCall<any[]>("/api/lessons/micro"),
  searchLessons: (query: any) =>
    apiCall<any>("/api/lessons/search", {
      method: "POST",
      body: JSON.stringify(query),
    }),

  // User Progress
  completeLesson: (lessonId: string, userId: string, progressPercentage = 100.0) =>
    apiCall<any>(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        progress_percentage: progressPercentage,
      }),
    }),

  getCompletedLessons: (userId: string) => apiCall<any[]>(`/api/users/${userId}/completed-lessons`),

  getUserProgress: (userId: string) => apiCall<any>(`/api/users/${userId}/progress`),
}

// Career Page Endpoints
export const careerAPI = {
  // Career Quiz & Matching
  getCareerQuiz: () => apiCall<any>("/api/career/quiz"),

  matchCareer: (data: any) =>
    apiCall<any>("/api/career/match", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getComprehensiveAnalysis: (data: any) =>
    apiCall<any>("/api/career/quiz/comprehensive-analysis", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Career Roadmaps
  getCareerRoadmap: (careerTitle: string) => apiCall<any>(`/api/career/roadmap/${careerTitle}`),

  getAllRoadmaps: () => apiCall<any[]>("/api/career/roadmaps"),

  generateRoadmap: (data: any) =>
    apiCall<any>("/api/career/roadmap/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateEnhancedRoadmap: (data: any) =>
    apiCall<any>("/api/career/roadmap/enhanced", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateUnifiedRoadmap: (data: any) =>
    apiCall<any>("/api/career/roadmap/unified", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateVisualRoadmap: (data: any) =>
    apiCall<any>("/api/career/roadmap/visual", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  clearRoadmapCache: () => apiCall<any>("/api/career/roadmap/cache/clear"),

  // Career Planning
  generateCareerPlanning: (data: any) =>
    apiCall<any>("/api/career/planning", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerPlanningOptions: () => apiCall<any>("/api/career/planning/options"),

  generateComprehensivePlan: (data: any) =>
    apiCall<any>("/api/career/comprehensive-plan", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAvailableCareers: () => apiCall<string[]>("/api/career/available"),

  // Career Guidance & Advice
  getCareerGuidance: (data: any) =>
    apiCall<any>("/api/career/guidance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerAdvice: (data: any) =>
    apiCall<any>("/api/career/advice", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerAdviceTopics: () => apiCall<string[]>("/api/career/advice/topics"),

  // Interview Preparation
  startInterviewSimulation: (data: any) =>
    apiCall<any>("/api/career/interview/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitInterviewAnswer: (data: any) =>
    apiCall<any>("/api/career/interview/answer", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInterviewRoles: () => apiCall<string[]>("/api/career/interview/roles"),

  generateInterviewPrep: (data: any) =>
    apiCall<any>("/api/career/roadmap/interview-prep", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Career Sessions
  getUserCareerSessions: (userId: string) => apiCall<any[]>(`/api/career/sessions/${userId}`),
}

// Chat Page Endpoints
export const chatAPI = {
  // Chat Functionality
  sendMessage: (data: any) =>
    apiCall<any>("/api/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadFile: (file: File, userId: string, conversationId?: string, explanationLevel?: string) => {
    const formData = new FormData()
    formData.append("file", file)
    if (conversationId) formData.append("conversation_id", conversationId)
    // per backend spec, explanation_level should be sent in the query, not as form field

    const url = `${API_BASE_URL}/api/chat/upload?user_id=${encodeURIComponent(userId)}${explanationLevel ? `&explanation_level=${encodeURIComponent(explanationLevel)}` : ""}`

    return fetch(url, {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      return res.json()
    })
  },

  ingestDistilled: (lessonId: string, userId: string, data: any) =>
    apiCall<any>(`/api/chat/ingest-distilled?lesson_id=${lessonId}&user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Chat Management
  getUserConversations: (userId: string) => apiCall<any[]>(`/api/chat/conversations/${userId}`),

  getConversation: (conversationId: string) => apiCall<any>(`/api/chat/conversation/${conversationId}`),

  getChatSideMenu: (userId: string) => apiCall<any>(`/api/chat/side-menu/${userId}`),

  // Chat Preferences
  updateExplanationLevel: (userId: string, level: string) =>
    apiCall<any>(`/api/chat/preferences/explanation-level`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, level }),
    }),

  updateFrameworkPreference: (userId: string, framework: string) =>
    apiCall<any>(`/api/chat/preferences/framework`, {
      method: "PUT",
      body: JSON.stringify({ user_id: userId, framework }),
    }),
}

// Agentic AI Endpoints
export const agenticAPI = {
  // Intent Detection & Routing
  routeMessage: (data: { message: string; pdf_id?: string; user_id?: string }) =>
    apiCall<{
      intent: string
      confidence: number
      message: string
      context: any
      suggestions?: string[]
    }>("/api/agent/route", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Summary Agent
  generateSummary: (data: { pdf_id: string; user_id: string; topic?: string }) =>
    apiCall<{
      summary: string
      concept_map: any
      key_points: string[]
      page_references: any
    }>("/api/agent/summary", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Diagnostic Agent
  startDiagnostic: (data: { pdf_id: string; user_id: string; topic?: string; num?: number }) =>
    apiCall<{
      questions: Array<{
        question: string
        options: string[]
        correct_answer: string
      }>
      mastery_before: any
      session_id: string
      estimated_duration: string
    }>("/api/agent/diagnostic", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  processDiagnosticResults: (data: {
    pdf_id: string
    user_id: string
    topic?: string
    user_answers: Array<{
      question_index: number
      selected_answer: string
      is_correct: boolean
    }>
    session_id: string
  }) =>
    apiCall<{
      status: string
      results: {
        mastery_after: any
        skill_gaps: string[]
        recommendations: string[]
        improvement_score: number
        next_steps: string[]
      }
    }>("/api/agent/diagnostic/results", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Mastery Tracking - with proper error handling for anonymous users
  getMastery: async (userId: string, topic?: string) => {
    // Don't make API call for anonymous users
    if (!userId || userId === "anonymous-user" || userId === "anonymous") {
      return {
        status: "success",
        mastery: {
          overall_score: 0,
          topic_scores: {},
          skill_breakdown: {},
          learning_progress: {},
          recommended_topics: ["Upload a document to start tracking your progress"],
        },
      }
    }

    const url = `/api/agent/mastery/${userId}${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`
    try {
      return await apiCall<{
        status: string
        mastery: {
          overall_score: number
          topic_scores: Record<string, number>
          skill_breakdown: Record<string, number>
          learning_progress: any
          recommended_topics: string[]
        }
      }>(url)
    } catch (error) {
      // Return default mastery data if API fails
      console.warn("Failed to fetch mastery data, returning defaults:", error)
      return {
        status: "success",
        mastery: {
          overall_score: 0,
          topic_scores: {},
          skill_breakdown: {},
          learning_progress: {},
          recommended_topics: ["Complete assessments to track your progress"],
        },
      }
    }
  },

  // Content Generation
  generateWorkflow: (data: { pdf_id: string; user_id: string; topic?: string }) =>
    apiCall<{
      workflow: Array<{
        step: number
        action: string
        description: string
        estimated_time?: string
        resources?: string[]
      }>
      total_steps: number
      estimated_duration: string
      difficulty_level: string
    }>("/api/agent/workflow", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateFlashcards: (data: { pdf_id: string; user_id: string; topic?: string; num?: number }) =>
    apiCall<{
      flashcards: Array<{
        front: string
        back: string
      }>
      total_cards: number
      difficulty_level: string
    }>("/api/agent/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateQuiz: (data: { pdf_id: string; user_id: string; topic?: string; num?: number }) =>
    apiCall<{
      questions: Array<{
        question: string
        options: string[]
        correct_answer: string
        explanation?: string
      }>
      total_questions: number
      difficulty_level: string
    }>("/api/agent/quiz", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateContent: async (data: {
    pdf_id: string
    user_id: string
    content_type: "lesson" | "quiz" | "flashcards" | "workflow"
    topic?: string
    difficulty?: string
  }) => {
    // Route to appropriate content generation endpoint
    switch (data.content_type) {
      case "quiz":
        return agenticAPI.generateQuiz({
          pdf_id: data.pdf_id,
          user_id: data.user_id,
          topic: data.topic,
          num: 10,
        })
      case "flashcards":
        return agenticAPI.generateFlashcards({
          pdf_id: data.pdf_id,
          user_id: data.user_id,
          topic: data.topic,
          num: 15,
        })
      case "workflow":
        return agenticAPI.generateWorkflow({
          pdf_id: data.pdf_id,
          user_id: data.user_id,
          topic: data.topic,
        })
      case "lesson":
        // For lesson generation, we'll use the learn API
        return learnAPI.generateLessonContent(data.pdf_id, "lesson", {
          user_id: data.user_id,
          difficulty: data.difficulty,
          topic: data.topic,
        })
      default:
        throw new Error(`Unsupported content type: ${data.content_type}`)
    }
  },

  // System Testing
  testSystem: () => apiCall<{ status: string; message: string }>("/api/agent/test"),
}

// Dashboard Page Endpoints
export const dashboardAPI = {
  // Dashboard Analytics
  getUserAnalytics: (userId: string) => apiCall<any>(`/api/dashboard/analytics/${userId}`),

  getUserProgress: (userId: string) => apiCall<any>(`/api/dashboard/progress/${userId}`),

  getUserAchievements: (userId: string) => apiCall<any>(`/api/dashboard/achievements/${userId}`),

  // Dashboard Recommendations
  getDashboardRecommendations: (data: any) =>
    apiCall<any>("/api/dashboard/recommendations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerCoaching: (data: any) =>
    apiCall<any>("/api/dashboard/coaching", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// User Management Endpoints
export const userAPI = {
  updateUserRole: (userId: string, role: string) =>
    apiCall<any>(`/api/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  getUserRole: (userId: string) => apiCall<any>(`/api/users/${userId}/role`),
}

// Recommendation Endpoints
export const recommendationAPI = {
  getGeneralRecommendations: (data: any) =>
    apiCall<any>("/api/recommendations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPersonalizedRecommendations: (data: any) =>
    apiCall<any>("/api/recommendations/personalized", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserRecommendations: (userId: string) => apiCall<any>(`/api/recommendations/user/${userId}`),

  getMarketTrends: () => apiCall<any>("/api/recommendations/market-trends"),
  getLearningPaths: () => apiCall<any>("/api/recommendations/learning-paths"),
}

// Analytics Endpoints
export const analyticsAPI = {
  getUserAnalytics: (userId: string) => apiCall<any>(`/api/analytics/user/${userId}`),
}

export default {
  health: healthAPI,
  learn: learnAPI,
  career: careerAPI,
  chat: chatAPI,
  agentic: agenticAPI,
  dashboard: dashboardAPI,
  user: userAPI,
  recommendation: recommendationAPI,
  analytics: analyticsAPI,
}
