// Centralized API service for TrainPI backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://trainbackend-production.up.railway.app";

// Generic API call helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Health & Debug Endpoints
export const healthAPI = {
  check: () => apiCall<{ status: string }>("/health"),
  test: () => apiCall<{ message: string }>("/api/test"),
  debugLesson: (lessonId: string) => apiCall<any>(`/api/debug/lesson/${lessonId}`),
};

// Learn Page Endpoints
export const learnAPI = {
  // PDF Processing & Lesson Management
  distill: (file: File, ownerId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    
    return fetch(`${API_BASE_URL}/api/distill?owner_id=${ownerId}`, {
      method: "POST",
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`Distill failed: ${res.status}`);
      return res.json();
    });
  },

  getLessonContent: (lessonId: string, action: string) => 
    apiCall<any>(`/api/lesson/${lessonId}/${action}`),

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

  getLessonContentForChat: (lessonId: string) =>
    apiCall<any>(`/api/chat/lesson/${lessonId}/content`),

  // Framework & Skills
  getFrameworks: () => apiCall<string[]>("/api/frameworks"),
  getSkills: () => apiCall<string[]>("/api/skills"),
  getExplanationLevels: () => apiCall<string[]>("/api/explanation-levels"),
  getLessonsByFramework: (framework: string) =>
    apiCall<any[]>(`/api/lessons/framework/${framework}`),

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

  getCompletedLessons: (userId: string) =>
    apiCall<any[]>(`/api/users/${userId}/completed-lessons`),

  getUserProgress: (userId: string) =>
    apiCall<any>(`/api/users/${userId}/progress`),
};

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
  getCareerRoadmap: (careerTitle: string) =>
    apiCall<any>(`/api/career/roadmap/${careerTitle}`),

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

  getCareerPlanningOptions: () =>
    apiCall<any>("/api/career/planning/options"),

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
  getUserCareerSessions: (userId: string) =>
    apiCall<any[]>(`/api/career/sessions/${userId}`),
};

// Chat Page Endpoints
export const chatAPI = {
  // Chat Functionality
  sendMessage: (data: any) =>
    apiCall<any>("/api/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  uploadFile: (file: File, userId: string, conversationId?: string, explanationLevel?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (conversationId) formData.append("conversation_id", conversationId);
    // per backend spec, explanation_level should be sent in the query, not as form field

    const url = `${API_BASE_URL}/api/chat/upload?user_id=${encodeURIComponent(userId)}${explanationLevel ? `&explanation_level=${encodeURIComponent(explanationLevel)}` : ""}`;

    return fetch(url, {
      method: "POST",
      body: formData,
    }).then(res => {
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      return res.json();
    });
  },

  ingestDistilled: (lessonId: string, userId: string, data: any) =>
    apiCall<any>(`/api/chat/ingest-distilled?lesson_id=${lessonId}&user_id=${encodeURIComponent(userId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Chat Management
  getUserConversations: (userId: string) =>
    apiCall<any[]>(`/api/chat/conversations/${userId}`),

  getConversation: (conversationId: string) =>
    apiCall<any>(`/api/chat/conversation/${conversationId}`),

  getChatSideMenu: (userId: string) =>
    apiCall<any>(`/api/chat/side-menu/${userId}`),

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
};

// Dashboard Page Endpoints
export const dashboardAPI = {
  // Dashboard Analytics
  getUserAnalytics: (userId: string) =>
    apiCall<any>(`/api/dashboard/analytics/${userId}`),

  getUserProgress: (userId: string) =>
    apiCall<any>(`/api/dashboard/progress/${userId}`),

  getUserAchievements: (userId: string) =>
    apiCall<any>(`/api/dashboard/achievements/${userId}`),

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
};

// User Management Endpoints
export const userAPI = {
  updateUserRole: (userId: string, role: string) =>
    apiCall<any>(`/api/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    }),

  getUserRole: (userId: string) =>
    apiCall<any>(`/api/users/${userId}/role`),
};

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

  getUserRecommendations: (userId: string) =>
    apiCall<any>(`/api/recommendations/user/${userId}`),

  getMarketTrends: () => apiCall<any>("/api/recommendations/market-trends"),
  getLearningPaths: () => apiCall<any>("/api/recommendations/learning-paths"),
};

// Analytics Endpoints
export const analyticsAPI = {
  getUserAnalytics: (userId: string) =>
    apiCall<any>(`/api/analytics/user/${userId}`),
};

export default {
  health: healthAPI,
  learn: learnAPI,
  career: careerAPI,
  chat: chatAPI,
  dashboard: dashboardAPI,
  user: userAPI,
  recommendation: recommendationAPI,
  analytics: analyticsAPI,
};
