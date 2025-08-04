#!/usr/bin/env python3
"""
Test script for deployed TrainPI backend
Tests all major endpoints and systems
"""

import requests
import json
import sys
from typing import Dict, Any

def test_endpoint(base_url: str, endpoint: str, method: str = "GET", data: Dict[str, Any] = None, files: Dict[str, Any] = None) -> bool:
    """Test a single endpoint"""
    try:
        url = f"{base_url}{endpoint}"
        
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            if files:
                response = requests.post(url, files=files)
            else:
                response = requests.post(url, json=data)
        elif method == "PUT":
            response = requests.put(url, json=data)
        
        print(f"✅ {method} {endpoint} - Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            try:
                result = response.json()
                print(f"   Response: {json.dumps(result, indent=2)[:200]}...")
            except:
                print(f"   Response: {response.text[:200]}...")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {method} {endpoint} - Error: {e}")
        return False

def test_microlearning_platform(base_url: str) -> bool:
    """Test microlearning platform endpoints"""
    print("\n🧪 Testing Microlearning Platform...")
    
    success = True
    
    # Test frameworks endpoint
    success &= test_endpoint(base_url, "/api/frameworks")
    
    # Test explanation levels endpoint
    success &= test_endpoint(base_url, "/api/explanation-levels")
    
    return success

def test_smart_career_pathfinder(base_url: str) -> bool:
    """Test smart career pathfinder endpoints"""
    print("\n🎯 Testing Smart Career Pathfinder...")
    
    success = True
    
    # Test initial suggestions
    success &= test_endpoint(base_url, "/api/career/smart/initial-suggestions")
    
    # Test skill suggestions
    skill_data = {
        "selected_interests": ["Technology"],
        "selected_skills": ["python"],
        "user_profile": {"experience_level": "entry"}
    }
    success &= test_endpoint(base_url, "/api/career/smart/suggest-skills", "POST", skill_data)
    
    # Test career discovery
    discovery_data = {
        "selected_interests": ["Technology", "Design"],
        "selected_skills": ["javascript", "react", "ui_ux"],
        "user_profile": {"experience_level": "mid"}
    }
    success &= test_endpoint(base_url, "/api/career/smart/discover", "POST", discovery_data)
    
    return success

def test_unified_career_system(base_url: str) -> bool:
    """Test unified career system endpoints"""
    print("\n🗺️ Testing Unified Career System...")
    
    success = True
    
    # Test unified roadmap with target role
    roadmap_data = {
        "user_profile": {"experience_level": "mid"},
        "target_role": "Data Scientist",
        "user_skills": ["python", "statistics"],
        "user_interests": ["Data Science"]
    }
    success &= test_endpoint(base_url, "/api/career/roadmap/unified", "POST", roadmap_data)
    
    # Test interview preparation
    interview_data = {
        "target_role": "Software Developer",
        "user_profile": {"experience_level": "entry"}
    }
    success &= test_endpoint(base_url, "/api/career/roadmap/interview-prep", "POST", interview_data)
    
    return success

def test_quiz_career_pathfinder(base_url: str) -> bool:
    """Test quiz-based career pathfinder"""
    print("\n🧪 Testing Quiz-Based Career Pathfinder...")
    
    success = True
    
    # Test quiz questions
    success &= test_endpoint(base_url, "/api/career/quiz")
    
    # Test career matching
    match_data = {
        "owner_id": "user123",
        "answers": [4, 3, 2, 5, 1, 3, 4, 2, 5, 1]
    }
    success &= test_endpoint(base_url, "/api/career/match", "POST", match_data)
    
    return success

def test_dashboard_analytics(base_url: str) -> bool:
    """Test dashboard and analytics endpoints"""
    print("\n📊 Testing Dashboard & Analytics...")
    
    success = True
    
    # Test user role update
    role_data = {"role": "Software Developer"}
    success &= test_endpoint(base_url, "/api/users/user123/role", "PUT", role_data)
    
    # Test lesson completion
    completion_data = {
        "user_id": "user123",
        "completion_time": 30
    }
    success &= test_endpoint(base_url, "/api/lessons/lesson123/complete", "POST", completion_data)
    
    # Test user progress
    success &= test_endpoint(base_url, "/api/users/user123/progress")
    
    # Test recommendations
    recommendation_data = {
        "user_id": "user123",
        "user_role": "Software Developer",
        "completed_lessons": ["lesson1", "lesson2"]
    }
    success &= test_endpoint(base_url, "/api/recommendations", "POST", recommendation_data)
    
    return success

def test_chatbot(base_url: str) -> bool:
    """Test chatbot endpoints"""
    print("\n🤖 Testing AI Chatbot...")
    
    success = True
    
    # Test text chat
    chat_data = {
        "user_id": "user123",
        "message": "How do I learn Python?",
        "conversation_id": "conv123"
    }
    success &= test_endpoint(base_url, "/api/chat", "POST", chat_data)
    
    # Test conversation history
    success &= test_endpoint(base_url, "/api/chat/conversations/user123")
    
    return success

def test_comprehensive_plan(base_url: str) -> bool:
    """Test comprehensive career plan endpoint"""
    print("\n🎯 Testing Comprehensive Career Plan...")
    
    plan_data = {
        "user_profile": {"experience_level": "mid"},
        "target_role": "Data Scientist",
        "user_skills": ["python", "statistics"],
        "user_interests": ["Data Science"]
    }
    
    return test_endpoint(base_url, "/api/career/comprehensive-plan", "POST", plan_data)

def main():
    """Main test function"""
    if len(sys.argv) != 2:
        print("Usage: python test_deployment.py <base_url>")
        print("Example: python test_deployment.py https://your-app.vercel.app")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print("🚀 **TRAINPI Backend Deployment Test**")
    print("=" * 50)
    print(f"Testing: {base_url}")
    print("=" * 50)
    
    # Test all systems
    results = {
        "Microlearning Platform": test_microlearning_platform(base_url),
        "Smart Career Pathfinder": test_smart_career_pathfinder(base_url),
        "Unified Career System": test_unified_career_system(base_url),
        "Quiz Career Pathfinder": test_quiz_career_pathfinder(base_url),
        "Dashboard & Analytics": test_dashboard_analytics(base_url),
        "AI Chatbot": test_chatbot(base_url),
        "Comprehensive Career Plan": test_comprehensive_plan(base_url)
    }
    
    # Print summary
    print("\n📊 **Test Results Summary**")
    print("=" * 50)
    
    total_tests = len(results)
    passed_tests = sum(results.values())
    
    for system, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {system}")
    
    print(f"\n🎯 **Overall Result: {passed_tests}/{total_tests} systems working**")
    
    if passed_tests == total_tests:
        print("🎉 **All systems are working correctly!**")
        return 0
    else:
        print("⚠️ **Some systems need attention**")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 