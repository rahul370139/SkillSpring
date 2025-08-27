const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backendskillspring-production.up.railway.app"

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

async function apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`API Error ${response.status}: ${errorData}`)
    }

    const data = await response.json()
    return data
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
  distill: async (file: File, ownerId: string, explanationLevel?: string, framework?: string) => {
    console.log("[v0] Starting distill upload with:", {
      fileName: file.name,
      fileSize: file.size,
      ownerId,
      explanationLevel,
      framework,
    })

    const formData = new FormData()
    formData.append("file", file)

    // Build query parameters
    const params = new URLSearchParams()
    params.append("owner_id", ownerId)

    if (explanationLevel) {
      params.append("explanation_level", explanationLevel)
    }
    if (framework) {
      params.append("framework", framework)
    }

    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const url = `${baseUrl}/api/distill?${params.toString()}`
    console.log("[v0] Making request to:", url)

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Error response body:", errorText)
        throw new Error(`Distill failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log("[v0] Success response:", result)
      return result
    } catch (error) {
      console.error("[v0] Distill request failed:", error)
      throw error
    }
  },

  getLessonContent: (lessonId: string, action: string) => apiCall<any>(`/api/lesson/${lessonId}/${action}`),

  generateLessonContent: (lessonId: string, action: string, data: any) =>
    apiCall<any>(`/api/lesson/${lessonId}/${action}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getLessonSummary: (lessonId: number, userId: string) =>
    apiCall<any>(`/api/chat/lesson/summary?lesson_id=${lessonId}&user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
    }),

  getLessonContentForChat: (lessonId: string, userId: string) =>
    apiCall<any>(`/api/chat/lesson/${lessonId}/content?user_id=${encodeURIComponent(userId)}`),

  // Framework & Skills
  getFrameworks: () => apiCall<string[]>("/api/frameworks"),
  getSkills: () => apiCall<string[]>("/api/skills"),
  getExplanationLevels: () => apiCall<string[]>("/api/explanation-levels"),
  getLessonsByFramework: (framework: string, limit = 10) =>
    apiCall<any[]>(`/api/lessons/framework/${framework}?limit=${limit}`),

  // Micro Lessons
  getMicroLessons: (category?: string) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : ""
    return apiCall<any[]>(`/api/lessons/micro${params}`)
  },

  searchLessons: (query: { query: string }) =>
    apiCall<any>("/api/lessons/search", {
      method: "POST",
      body: JSON.stringify(query),
    }),

  // User Progress
  completeLesson: (lessonId: string, userId: string, progressPercentage = 100.0) =>
    apiCall<any>(
      `/api/lessons/${lessonId}/complete?user_id=${encodeURIComponent(userId)}&progress_percentage=${progressPercentage}`,
      {
        method: "POST",
      },
    ),

  getCompletedLessons: (userId: string) => apiCall<any[]>(`/api/users/${userId}/completed-lessons`),

  getUserProgress: (userId: string) => apiCall<any>(`/api/users/${userId}/progress`),

  uploadFile: async (file: File, userId: string, conversationId?: string, explanationLevel?: string) => {
    return chatAPI.uploadFile(file, userId, conversationId, explanationLevel)
  },

  chat: async (data: {
    message: string
    user_id: string
    conversation_id?: string
    explanation_level?: string
  }) => {
    return chatAPI.sendMessage(data)
  },
}

// Career Page Endpoints
export const careerAPI = {
  // Career Quiz & Matching
  getCareerQuiz: () => apiCall<any>("/api/career/quiz"),

  matchCareer: async (data: {
    owner_id: string
    answers: number[]
    user_profile?: any
  }) => {
    try {
      return await apiCall("/api/career/match", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.warn("Career match API failed, using fallback")
      return {
        results: [
          {
            title: "Software Engineer",
            salary_low: 70000,
            salary_high: 120000,
            growth_pct: 22,
            common_skills: ["JavaScript", "React", "Node.js"],
            day_in_life: "Build and maintain software applications using various programming languages",
            similarity: 0.85,
          },
          {
            title: "Data Scientist",
            salary_low: 80000,
            salary_high: 140000,
            growth_pct: 35,
            common_skills: ["Python", "Machine Learning", "Statistics"],
            day_in_life: "Analyze complex data to help organizations make data-driven decisions",
            similarity: 0.78,
          },
          {
            title: "UX Designer",
            salary_low: 60000,
            salary_high: 100000,
            growth_pct: 18,
            common_skills: ["Design Thinking", "Figma", "User Research"],
            day_in_life: "Create intuitive and user-friendly digital experiences",
            similarity: 0.72,
          },
        ],
      }
    }
  },

  getComprehensiveCareerAnalysis: (data: {
    answers: number[]
    user_skills?: string[]
  }) =>
    apiCall<any>("/api/career/quiz/comprehensive-analysis", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Career Roadmaps - Updated endpoints
  getCareerRoadmap: (careerTitle: string) => apiCall<any>(`/api/career/roadmap/${encodeURIComponent(careerTitle)}`),

  getAllRoadmaps: () => apiCall<any[]>("/api/career/roadmaps"),

  generateRoadmap: async (data: {
    user_profile?: any
    target_role?: string
    user_skills?: string[]
    user_interests?: string[]
  }) => {
    try {
      return await apiCall("/api/career/roadmap/unified", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      console.warn("Roadmap API failed, using fallback")
      return {
        target_role: data.target_role || "Software Developer",
        roadmap: {
          foundational: {
            title: "Foundation Skills",
            description: "Learn the fundamental skills required",
            skills: data.user_skills?.slice(0, 3) || ["HTML", "CSS", "JavaScript"],
            duration: "2-3 months",
            salary_range: "$50k - $70k",
            responsibilities: ["Learn basics", "Build simple projects"],
            learning_objectives: ["Understand core concepts", "Practice coding"],
            recommended_lessons: [],
            skill_gaps: [],
          },
          intermediate: {
            title: "Intermediate Development",
            description: "Build practical projects and gain hands-on experience",
            skills: data.user_skills?.slice(3, 6) || ["React", "Node.js", "Database"],
            duration: "3-4 months",
            salary_range: "$70k - $90k",
            responsibilities: ["Build complex projects", "Work in teams"],
            learning_objectives: ["Master frameworks", "Understand architecture"],
            recommended_lessons: [],
            skill_gaps: [],
          },
          advanced: {
            title: "Advanced Specialization",
            description: "Specialize in advanced topics and prepare for job market",
            skills: ["System Design", "Advanced Patterns", "Leadership"],
            duration: "2-3 months",
            salary_range: "$90k - $120k",
            responsibilities: ["Lead projects", "Mentor others"],
            learning_objectives: ["Master advanced concepts", "Develop leadership"],
            recommended_lessons: [],
            skill_gaps: [],
          },
        },
        interview_preparation: {},
        market_insights: {},
        learning_plan: {},
        coaching_advice: {},
        confidence_score: 0.8,
        timeline: {},
        estimated_time_to_target: {},
      }
    }
  },

  generateCareerPlanning: (data: {
    interests: string[]
    skills: string[]
  }) =>
    apiCall<any>("/api/career/planning", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerPlanningOptions: () => apiCall<any>("/api/career/planning/options"),

  generateComprehensivePlan: (data: {
    user_profile: any
    target_role?: string
    user_skills?: string[]
    user_interests?: string[]
  }) =>
    apiCall<any>("/api/career/comprehensive-plan", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getAvailableCareers: () => apiCall<string[]>("/api/career/available"),

  generateEnhancedRoadmap: (data: {
    career_title: string
    user_skills: string[]
  }) =>
    apiCall<any>("/api/career/roadmap/enhanced", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerGuidance: (data: {
    user_id: string
    user_profile: any
    query: string
  }) =>
    apiCall<any>("/api/career/guidance", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerAdvice: (data: {
    topic: string
    user_context?: any
  }) =>
    apiCall<any>("/api/career/advice", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCareerAdviceTopics: () => apiCall<string[]>("/api/career/advice/topics"),

  startInterviewSimulation: (data: {
    user_id: string
    target_role: string
    difficulty?: string
  }) =>
    apiCall<any>("/api/career/interview/start", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitInterviewAnswer: (data: {
    session_id: string
    answer: string
  }) =>
    apiCall<any>("/api/career/interview/answer", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInterviewRoles: () => apiCall<string[]>("/api/career/interview/roles"),

  generateInterviewPrep: (data: {
    target_role: string
    user_profile?: any
  }) =>
    apiCall<any>("/api/career/roadmap/interview-prep", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUserCareerSessions: (userId: string) => apiCall<any[]>(`/api/career/sessions/${userId}`),

  generateVisualRoadmap: (data: {
    target_role: string
    user_skills: string[]
    user_experience: string
    include_visual?: boolean
  }) =>
    apiCall<any>("/api/career/roadmap/visual", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// Chat Page Endpoints
export const chatAPI = {
  // Chat Functionality
  sendMessage: async (data: any) => {
    console.log("[v0] Starting chat message with:", data)

    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const url = `${baseUrl}/api/chat`
    console.log("[v0] Making chat request to:", url)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      console.log("[v0] Chat response status:", response.status)
      console.log("[v0] Chat response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Chat error response body:", errorText)
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("[v0] Chat success response:", result)
      return result
    } catch (error) {
      console.error("[v0] Chat request failed:", error)
      throw error
    }
  },

  uploadFile: async (file: File, userId: string, conversationId?: string, explanationLevel?: string) => {
    console.log("[v0] Starting chat upload with:", {
      fileName: file.name,
      fileSize: file.size,
      userId,
      conversationId,
      explanationLevel,
    })

    const formData = new FormData()
    formData.append("file", file)
    if (conversationId) {
      formData.append("conversation_id", conversationId)
    }

    // Build query parameters
    const params = new URLSearchParams()
    params.append("user_id", userId)
    if (explanationLevel) {
      params.append("explanation_level", explanationLevel)
    }

    const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL
    const url = `${baseUrl}/api/chat/upload?${params.toString()}`
    console.log("[v0] Making chat upload request to:", url)

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Chat upload response status:", response.status)
      console.log("[v0] Chat upload response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Chat upload error response body:", errorText)
        throw new Error(`Upload failed: ${response.status}${errorText ? ` - ${errorText}` : ""}`)
      }

      const result = await response.json()
      console.log("[v0] Chat upload success response:", result)
      return result
    } catch (error) {
      console.error("[v0] Chat upload request failed:", error)
      throw error
    }
  },

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
  routeMessage: (data: any) =>
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
  generateSummary: (data: any) =>
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
  startDiagnostic: (data: any) =>
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

  processDiagnosticResults: (data: any) =>
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

  // Mastery Tracking
  getMastery: async (userId: string, topic?: string) => {
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
  generateWorkflow: (data: any) =>
    apiCall<any>("/api/generate/workflow", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateFlashcards: (data: any) =>
    apiCall<any>("/api/generate/flashcards", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateQuiz: (data: any) =>
    apiCall<any>("/api/generate/quiz", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateLesson: (data: any) =>
    apiCall<any>("/api/generate/lesson", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  generateContent: async (data: {
    content_type: "lesson" | "quiz" | "flashcards" | "workflow"
    [key: string]: any
  }) => {
    switch (data.content_type) {
      case "quiz":
        return agenticAPI.generateQuiz(data)
      case "flashcards":
        return agenticAPI.generateFlashcards(data)
      case "workflow":
        return agenticAPI.generateWorkflow(data)
      case "lesson":
        return agenticAPI.generateLesson(data)
      default:
        throw new Error(`Unsupported content type: ${data.content_type}`)
    }
  },

  // System Testing
  testSystem: () => apiCall<{ status: string; message: string }>("/api/agent/test"),

  ingestPdf: (file: File, userId: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("user_id", userId)

    return fetch(`${API_BASE_URL}/api/ingest/pdf`, {
      method: "POST",
      body: formData,
    }).then((res) => {
      if (!res.ok) throw new Error(`PDF ingestion failed: ${res.status}`)
      return res.json()
    })
  },

  detectIntent: async (data: { message: string; user_id: string }) => {
    try {
      return await agenticAPI.routeMessage(data)
    } catch (error) {
      return { intent: "general", confidence: 0.5 }
    }
  },

  runDiagnostic: async (data: { topic: string; user_id: string }) => {
    try {
      return await agenticAPI.startDiagnostic(data)
    } catch (error) {
      return {
        diagnostic: {
          strengths: ["Basic understanding"],
          weaknesses: ["Advanced concepts"],
          recommendations: ["Practice more examples"],
        },
      }
    }
  },
}

// Dashboard Page Endpoints
export const dashboardAPI = {
  // Dashboard Analytics
  getUserAnalytics: (userId: string, timePeriod = "30d") =>
    apiCall<any>(`/api/dashboard/analytics/${userId}?time_period=${timePeriod}`),

  getUserProgress: (userId: string) => apiCall<any>(`/api/dashboard/progress/${userId}`),

  getUserAchievements: (userId: string) => apiCall<any>(`/api/dashboard/achievements/${userId}`),

  getDashboardRecommendations: (
    userId: string,
    targetRole?: string,
    data?: {
      user_profile?: any
      user_skills?: string[]
      user_interests?: string[]
    },
  ) =>
    apiCall<any>(
      `/api/dashboard/recommendations?user_id=${encodeURIComponent(userId)}${targetRole ? `&target_role=${encodeURIComponent(targetRole)}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify(data || {}),
      },
    ),

  getCareerCoaching: (
    userId: string,
    targetRole?: string,
    data?: {
      user_profile?: any
      current_challenges?: string[]
    },
  ) =>
    apiCall<any>(
      `/api/dashboard/coaching?user_id=${encodeURIComponent(userId)}${targetRole ? `&target_role=${encodeURIComponent(targetRole)}` : ""}`,
      {
        method: "POST",
        body: JSON.stringify(data || {}),
      },
    ),

  getStats: async (userId: string) => {
    try {
      const progress = await apiCall(`/api/dashboard/progress/${userId}`)
      return {
        stats: {
          lessonsCompleted: progress.lessons_completed || 0,
          hoursLearned: progress.hours_spent || 0,
          skillsAcquired: progress.skills_learned || 0,
          certificatesEarned: progress.certificates_earned || 0,
        },
      }
    } catch (error) {
      return {
        stats: {
          lessonsCompleted: 0,
          hoursLearned: 0,
          skillsAcquired: 0,
          certificatesEarned: 0,
        },
      }
    }
  },

  getProgress: async (userId: string) => {
    try {
      return await apiCall(`/api/dashboard/progress/${userId}`)
    } catch (error) {
      return {
        progress: {
          currentStreak: 0,
          weeklyGoal: 10,
          weeklyProgress: 0,
          monthlyStats: [],
        },
      }
    }
  },

  getRecentActivity: async (userId: string) => {
    try {
      const progress = await apiCall(`/api/dashboard/progress/${userId}`)
      return {
        activities: progress.recent_activity || [],
      }
    } catch (error) {
      return {
        activities: [],
      }
    }
  },
}

// User Management Endpoints
export const userAPI = {
  updateUserRole: (
    userId: string,
    data: {
      user_id: string
      role: string
      experience_level: string
      interests?: string[]
    },
  ) =>
    apiCall<any>(`/api/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify(data),
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
