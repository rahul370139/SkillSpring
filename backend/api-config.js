// 🚀 TrainPI API Configuration
// Replace this with your actual Railway URL

const API_CONFIG = {
  // Base URL for all API calls
  BASE_URL: 'https://trainbackend-production.up.railway.app',
  
  // Available endpoints
  ENDPOINTS: {
    // Health & Status
    HEALTH: '/',
    HEALTH_CHECK: '/health',
    API_DOCS: '/docs',
    
    // Test endpoints
    TEST: '/api/test',
    FRAMEWORKS: '/api/frameworks',
    
    // Microlearning Platform
    DISTILL: '/api/distill',
    EXPLANATION_LEVELS: '/api/explanation-levels',
    
    // Smart Career Pathfinder
    INITIAL_SUGGESTIONS: '/api/career/smart/initial-suggestions',
    SUGGEST_SKILLS: '/api/career/smart/suggest-skills',
    DISCOVER_CAREERS: '/api/career/smart/discover',
    
    // Unified Career Roadmap
    UNIFIED_ROADMAP: '/api/career/roadmap/unified',
    INTERVIEW_PREP: '/api/career/roadmap/interview-prep',
    
    // Dashboard & Analytics
    UPDATE_USER_ROLE: '/api/users/{user_id}/role',
    COMPLETE_LESSON: '/api/lessons/{lesson_id}/complete',
    GET_USER_PROGRESS: '/api/users/{user_id}/progress',
    GET_RECOMMENDATIONS: '/api/recommendations',
    
    // AI Chatbot
    SEND_CHAT: '/api/chat',
    UPLOAD_CHAT_FILE: '/api/chat/upload',
    GET_CONVERSATIONS: '/api/chat/conversations/{user_id}'
  },
  
  // Default headers for API calls
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Helper function to build full URL
  buildUrl: (endpoint, params = {}) => {
    let url = API_CONFIG.BASE_URL + endpoint;
    
    // Replace path parameters
    Object.keys(params.path || {}).forEach(key => {
      url = url.replace(`{${key}}`, params.path[key]);
    });
    
    // Add query parameters
    if (params.query) {
      const queryString = new URLSearchParams(params.query).toString();
      url += `?${queryString}`;
    }
    
    return url;
  },
  
  // Helper function for API calls
  apiCall: async (endpoint, options = {}) => {
    const url = API_CONFIG.buildUrl(endpoint, options);
    
    const config = {
      headers: {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...options.headers
      },
      ...options
    };
    
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }
};

// Example usage:
/*
// GET request
const frameworks = await API_CONFIG.apiCall(API_CONFIG.ENDPOINTS.FRAMEWORKS);

// POST request with body
const roadmap = await API_CONFIG.apiCall(API_CONFIG.ENDPOINTS.UNIFIED_ROADMAP, {
  method: 'POST',
  body: JSON.stringify({
    user_profile: userProfile,
    target_role: 'Data Scientist'
  })
});

// GET with path parameters
const userProgress = await API_CONFIG.apiCall(API_CONFIG.ENDPOINTS.GET_USER_PROGRESS, {
  params: {
    path: { user_id: '123' }
  }
});
*/

export default API_CONFIG; 