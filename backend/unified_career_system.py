"""
Unified Career System - Complete career planning with roadmap, coaching, and recommendations
"""

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

import pandas as pd
import numpy as np
from loguru import logger
from groq import Groq

from schemas import (
    UnifiedRoadmapRequest, UnifiedRoadmapResponse, InterviewPrepRequest, InterviewPrepResponse,
    CareerGuidanceRequest, CareerGuidanceResponse,
    CareerDiscoveryRequest, CareerDiscoveryResponse
)

class UnifiedCareerSystem:
    """
    Unified career system that combines:
    1. Career Roadmap Generation (with/without target role)
    2. AI Career Coaching and Interview Preparation
    3. Market Insights and Learning Recommendations
    4. Skill Gap Analysis and Learning Paths
    5. Career Discovery and Recommendations
    """
    
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.data_path = Path(__file__).parent / "data"
        
        # Load career data and micro-lessons
        self.career_data = self._load_career_data()
        self.micro_lessons = self._load_micro_lessons()
        
        # Cache for roadmaps
        self.roadmap_cache = self._load_cache("roadmap_cache.json")
        
        # Coaching sessions store
        self.coaching_sessions = {}
        
        logger.info("UnifiedCareerSystem initialized successfully")
    
    def _load_career_data(self) -> pd.DataFrame:
        """Load career data from processed CSV"""
        try:
            df = pd.read_csv(self.data_path / "onet_bls_trimmed.csv")
            logger.info(f"Loaded {len(df)} careers")
            return df
        except FileNotFoundError:
            logger.warning("Career data not found, using sample data")
            return self._create_sample_career_data()
    
    def _load_micro_lessons(self) -> Dict:
        """Load micro-lessons data"""
        try:
            with open(self.data_path / "micro_lessons.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return self._create_default_micro_lessons()
    
    def _load_cache(self, filename: str) -> Dict:
        """Load cache file"""
        try:
            with open(self.data_path / filename, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def _save_cache(self, data: Dict, filename: str):
        """Save cache to file"""
        try:
            with open(self.data_path / filename, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving cache: {e}")
    
    def _create_sample_career_data(self) -> pd.DataFrame:
        """Create sample career data for testing"""
        return pd.DataFrame({
            'title': ['Software Developer', 'Data Scientist', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer'],
            'salary_low': [60000, 70000, 65000, 55000, 65000],
            'salary_high': [120000, 140000, 130000, 110000, 130000],
            'growth_pct': [15.0, 25.0, 20.0, 12.0, 18.0],
            'top_skills': ['python,api,testing', 'python,ml,statistics', 'docker,aws,ci_cd', 'javascript,react,css', 'python,java,api'],
            'day_in_life': ['Develop software applications', 'Analyze data and build ML models', 'Manage infrastructure', 'Build user interfaces', 'Develop server-side applications']
        })
    
    def _create_default_micro_lessons(self) -> Dict:
        """Create default micro-lessons"""
        return {
            "programming": [
                {"title": "Python Basics", "description": "Learn Python fundamentals", "duration": 30, "skills": ["python"]},
                {"title": "JavaScript Fundamentals", "description": "Learn JavaScript basics", "duration": 30, "skills": ["javascript"]},
                {"title": "React Development", "description": "Build React applications", "duration": 45, "skills": ["react", "javascript"]},
                {"title": "API Development", "description": "Build REST APIs", "duration": 45, "skills": ["api", "python"]}
            ],
            "data_science": [
                {"title": "Machine Learning Intro", "description": "ML fundamentals", "duration": 60, "skills": ["ml", "python"]},
                {"title": "Data Analysis", "description": "Data analysis techniques", "duration": 45, "skills": ["statistics", "python"]}
            ],
            "devops": [
                {"title": "Docker Basics", "description": "Containerization with Docker", "duration": 30, "skills": ["docker"]},
                {"title": "AWS Fundamentals", "description": "Cloud computing with AWS", "duration": 45, "skills": ["aws", "cloud"]}
            ]
        }
    
    async def generate_unified_roadmap(
        self,
        user_profile: Optional[Dict] = None,
        target_role: Optional[str] = None,
        user_skills: Optional[List[str]] = None,
        user_interests: Optional[List[str]] = None
    ) -> Dict:
        """
        Generate unified roadmap with all features:
        1. Target role recommendation (if not provided)
        2. Detailed career roadmap
        3. Interview preparation
        4. Market insights
        5. Learning recommendations
        6. Career coaching advice
        """
        
        try:
            # Step 1: Recommend target role if not provided
            if not target_role:
                target_role = await self._recommend_target_role(user_profile, user_skills, user_interests)
            
            # Step 2: Generate comprehensive roadmap
            roadmap = await self._generate_detailed_roadmap(target_role, user_skills, user_profile)
            
            # Step 3: Generate interview preparation
            interview_prep = await self._generate_interview_preparation(target_role, user_profile)
            
            # Step 4: Generate market insights
            market_insights = await self._generate_market_insights(target_role)
            
            # Step 5: Generate learning recommendations
            learning_plan = await self._generate_learning_plan(target_role, user_skills, user_profile)
            
            # Step 6: Generate career coaching advice
            coaching_advice = await self._generate_career_coaching_advice(target_role, user_profile)
            
            # Step 7: Calculate confidence and timeline
            confidence_score = self._calculate_confidence_score(user_skills, target_role)
            timeline = self._create_timeline(roadmap, user_profile)
            
            return {
                "target_role": target_role,
                "roadmap": roadmap,
                "interview_preparation": interview_prep,
                "market_insights": market_insights,
                "learning_plan": learning_plan,
                "coaching_advice": coaching_advice,
                "confidence_score": confidence_score,
                "timeline": timeline,
                "estimated_time_to_target": self._estimate_time_to_target(roadmap, user_profile)
            }
            
        except Exception as e:
            logger.error(f"Error generating unified roadmap: {e}")
            return self._get_fallback_roadmap(target_role, user_skills, user_interests)
    
    async def _recommend_target_role(
        self, 
        user_profile: Optional[Dict] = None,
        user_skills: Optional[List[str]] = None,
        user_interests: Optional[List[str]] = None
    ) -> str:
        """Recommend target role using AI"""
        
        prompt = f"""
        Based on the following user profile, recommend the best target career role:
        
        User Profile: {user_profile}
        User Skills: {user_skills or []}
        User Interests: {user_interests or []}
        
        Available roles: {list(self.career_data['title'].unique())}
        
        Consider:
        1. Skill alignment with career requirements
        2. Interest match with career focus
        3. User experience level and career progression
        4. Market demand and growth potential
        5. Salary expectations and work-life balance
        
        Return only the exact job title from the available roles that best matches the user's profile.
        """
        
        try:
            response = await self._call_groq(prompt)
            recommended_role = response.strip()
            
            # Validate the recommended role exists in our data
            if recommended_role in self.career_data['title'].values:
                return recommended_role
            else:
                # Find closest match
                return self._find_closest_role(recommended_role)
                
        except Exception as e:
            logger.error(f"Error recommending target role: {e}")
            return "Software Developer"  # Default fallback
    
    async def _generate_detailed_roadmap(
        self, 
        target_role: str, 
        user_skills: Optional[List[str]] = None,
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """Generate detailed career roadmap with caching"""
        
        # Check cache first
        cache_key = f"{target_role}_{hash(str(user_skills))}"
        if cache_key in self.roadmap_cache:
            return self.roadmap_cache[cache_key]
        
        # Get role data
        role_data = self.career_data[self.career_data['title'] == target_role]
        if role_data.empty:
            roadmap = self._create_fallback_roadmap(target_role)
        else:
            data = role_data.iloc[0]
            
            # Generate roadmap using AI
            roadmap = await self._generate_ai_roadmap(target_role, user_skills, data)
        
        # Cache the result
        self.roadmap_cache[cache_key] = roadmap
        self._save_cache(self.roadmap_cache, "roadmap_cache.json")
        
        return roadmap
    
    async def _generate_ai_roadmap(self, target_role: str, user_skills: Optional[List[str]], role_data: pd.Series) -> Dict:
        """Generate AI-powered roadmap"""
        
        prompt = f"""
        Create a detailed 3-level career roadmap for {target_role}:
        
        Role Information:
        - Salary Range: ${role_data['salary_low']:,} - ${role_data['salary_high']:,}
        - Growth Rate: {role_data['growth_pct']}%
        - Required Skills: {role_data['top_skills']}
        - Day in Life: {role_data['day_in_life']}
        
        User's Current Skills: {user_skills or []}
        
        Create roadmap with:
        1. Foundational Level (Entry-level, 0-2 years)
        2. Intermediate Level (Mid-career, 2-5 years)
        3. Advanced Level (Senior/Expert, 5+ years)
        
        For each level include:
        - Required skills and competencies
        - Salary range
        - Typical responsibilities and projects
        - Learning objectives and milestones
        - Duration estimate
        - Key portfolio items and achievements
        - Career advancement opportunities
        
        Return as JSON with structure:
        {{
            "levels": [
                {{
                    "name": "Foundational",
                    "skills": ["skill1", "skill2"],
                    "salary_range": {{"min": 50000, "max": 80000}},
                    "responsibilities": ["resp1", "resp2"],
                    "learning_objectives": ["obj1", "obj2"],
                    "duration_months": 24,
                    "portfolio_items": ["project1", "project2"],
                    "advancement_opportunities": ["opportunity1", "opportunity2"]
                }}
            ]
        }}
        """
        
        try:
            response = await self._call_groq(prompt)
            return json.loads(response)
        except Exception as e:
            logger.error(f"Error generating AI roadmap: {e}")
            return self._create_fallback_roadmap(target_role)
    
    async def _generate_interview_preparation(self, target_role: str, user_profile: Optional[Dict] = None) -> Dict:
        """Generate comprehensive interview preparation"""
        
        prompt = f"""
        Create comprehensive interview preparation guidance for {target_role}:
        
        User Profile: {user_profile}
        
        Include:
        1. Common interview questions (technical and behavioral)
        2. Technical skills to demonstrate
        3. Behavioral questions and sample answers
        4. Portfolio project suggestions
        5. Interview tips and strategies
        6. Salary negotiation advice
        7. Company research tips
        8. Follow-up strategies
        
        Return as JSON with these sections.
        """
        
        try:
            response = await self._call_groq(prompt)
            return json.loads(response)
        except Exception as e:
            logger.error(f"Error generating interview preparation: {e}")
            return self._get_fallback_interview_prep(target_role)
    
    async def _generate_market_insights(self, target_role: str) -> Dict:
        """Generate market insights and trends"""
        
        role_data = self.career_data[self.career_data['title'] == target_role]
        if role_data.empty:
            return {"error": "Role data not found"}
        
        data = role_data.iloc[0]
        
        prompt = f"""
        Generate market insights for {target_role}:
        
        Current Data:
        - Salary Range: ${data['salary_low']:,} - ${data['salary_high']:,}
        - Growth Rate: {data['growth_pct']}%
        - Required Skills: {data['top_skills']}
        
        Provide insights on:
        1. Market demand and trends
        2. Salary trends and negotiation tips
        3. Required skills evolution
        4. Industry outlook and opportunities
        5. Geographic opportunities
        6. Remote work trends
        7. Emerging technologies affecting this role
        8. Career advancement opportunities
        
        Return as JSON with these sections.
        """
        
        try:
            response = await self._call_groq(prompt)
            return json.loads(response)
        except Exception as e:
            logger.error(f"Error generating market insights: {e}")
            return self._get_fallback_market_insights(data)
    
    async def _generate_learning_plan(
        self, 
        target_role: str, 
        user_skills: Optional[List[str]] = None,
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """Generate personalized learning plan"""
        
        # Get role requirements
        role_data = self.career_data[self.career_data['title'] == target_role]
        if role_data.empty:
            return self._get_fallback_learning_plan()
        
        required_skills = role_data.iloc[0]['top_skills'].split(',')
        current_skills = user_skills or []
        
        # Identify skill gaps
        skill_gaps = [skill for skill in required_skills if skill not in current_skills]
        
        # Find relevant micro-lessons
        recommended_lessons = []
        for skill in skill_gaps:
            lessons = self._find_lessons_for_skill(skill)
            recommended_lessons.extend(lessons)
        
        # Remove duplicates
        unique_lessons = self._deduplicate_lessons(recommended_lessons)
        
        return {
            "skill_gaps": skill_gaps,
            "recommended_lessons": unique_lessons[:10],
            "estimated_duration_hours": sum(lesson.get("duration", 30) for lesson in unique_lessons[:10]),
            "learning_strategy": "Focus on hands-on projects and practical application of skills.",
            "priority_skills": skill_gaps[:5]
        }
    
    async def _generate_career_coaching_advice(self, target_role: str, user_profile: Optional[Dict] = None) -> Dict:
        """Generate personalized career coaching advice"""
        
        prompt = f"""
        Provide comprehensive career coaching advice for someone targeting {target_role}:
        
        User Profile: {user_profile}
        
        Include advice on:
        1. Career development strategies
        2. Skill development priorities
        3. Networking and professional relationships
        4. Personal branding and online presence
        5. Work-life balance and stress management
        6. Continuous learning and staying updated
        7. Mentorship and guidance seeking
        8. Career transition strategies
        
        Return as JSON with these sections.
        """
        
        try:
            response = await self._call_groq(prompt)
            return json.loads(response)
        except Exception as e:
            logger.error(f"Error generating career coaching advice: {e}")
            return self._get_fallback_coaching_advice(target_role)
    
    def _calculate_confidence_score(self, user_skills: Optional[List[str]], target_role: str) -> float:
        """Calculate confidence score for the career plan"""
        
        if not user_skills:
            return 0.5
        
        role_data = self.career_data[self.career_data['title'] == target_role]
        if role_data.empty:
            return 0.5
        
        required_skills = role_data.iloc[0]['top_skills'].split(',')
        skill_match = len(set(user_skills) & set(required_skills)) / len(required_skills)
        
        return min(1.0, skill_match + 0.3)  # Add some base confidence
    
    def _create_timeline(self, roadmap: Dict, user_profile: Optional[Dict] = None) -> Dict:
        """Create timeline and milestones"""
        
        total_months = 0
        milestones = []
        
        for level in roadmap.get('levels', []):
            duration = level.get('duration_months', 12)
            total_months += duration
            
            milestones.append({
                "level": level['name'],
                "duration_months": duration,
                "key_achievements": level.get('portfolio_items', []),
                "learning_objectives": level.get('learning_objectives', [])
            })
        
        return {
            "total_duration_months": total_months,
            "milestones": milestones,
            "estimated_completion_date": f"{total_months} months from start"
        }
    
    def _estimate_time_to_target(self, roadmap: Dict, user_profile: Optional[Dict] = None) -> Dict:
        """Estimate time to reach target role"""
        
        total_months = sum(level.get('duration_months', 12) for level in roadmap.get('levels', []))
        
        # Adjust based on user profile
        if user_profile:
            experience_level = user_profile.get("experience_level", "entry")
            if experience_level == "senior":
                total_months = max(6, total_months // 2)  # Faster for seniors
            elif experience_level == "mid":
                total_months = max(12, int(total_months * 0.8))  # Slightly faster for mid-level
        
        return {
            "estimated_months": total_months,
            "estimated_years": round(total_months / 12, 1),
            "key_milestones": [level['name'] for level in roadmap.get('levels', [])]
        }
    
    def _find_closest_role(self, recommended_role: str) -> str:
        """Find closest matching role in our data"""
        available_roles = self.career_data['title'].tolist()
        
        for role in available_roles:
            if recommended_role.lower() in role.lower() or role.lower() in recommended_role.lower():
                return role
        
        return "Software Developer"  # Default fallback
    
    def _find_lessons_for_skill(self, skill: str) -> List[Dict]:
        """Find micro-lessons relevant to a specific skill"""
        relevant_lessons = []
        
        for category, lessons in self.micro_lessons.items():
            for lesson in lessons:
                lesson_skills = lesson.get("skills", [])
                if skill.lower() in [s.lower() for s in lesson_skills]:
                    lesson["category"] = category
                    relevant_lessons.append(lesson)
        
        return relevant_lessons
    
    def _deduplicate_lessons(self, lessons: List[Dict]) -> List[Dict]:
        """Remove duplicate lessons based on title"""
        seen_titles = set()
        unique_lessons = []
        
        for lesson in lessons:
            title = lesson.get("title", "")
            if title not in seen_titles:
                seen_titles.add(title)
                unique_lessons.append(lesson)
        
        return unique_lessons
    
    async def _call_groq(self, prompt: str) -> str:
        """Call Groq API with error handling"""
        try:
            completion = self.client.chat.completions.create(
                model="gemma2-9b-it",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1024
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise
    
    def _create_fallback_roadmap(self, target_role: str) -> Dict:
        """Create fallback roadmap"""
        return {
            "levels": [
                {
                    "name": "Foundational",
                    "skills": ["Basic programming", "Problem solving"],
                    "salary_range": {"min": 50000, "max": 80000},
                    "responsibilities": ["Learn fundamentals", "Build basic projects"],
                    "learning_objectives": ["Master core concepts", "Build portfolio"],
                    "duration_months": 24,
                    "portfolio_items": ["Personal website", "Simple applications"],
                    "advancement_opportunities": ["Junior Developer", "Internship"]
                },
                {
                    "name": "Intermediate",
                    "skills": ["Advanced programming", "System design"],
                    "salary_range": {"min": 80000, "max": 120000},
                    "responsibilities": ["Build complex systems", "Mentor juniors"],
                    "learning_objectives": ["Deep technical expertise", "Leadership skills"],
                    "duration_months": 36,
                    "portfolio_items": ["Complex applications", "Open source contributions"],
                    "advancement_opportunities": ["Senior Developer", "Team Lead"]
                },
                {
                    "name": "Advanced",
                    "skills": ["Architecture", "Leadership"],
                    "salary_range": {"min": 120000, "max": 200000},
                    "responsibilities": ["Technical leadership", "Strategic decisions"],
                    "learning_objectives": ["Architecture expertise", "Business acumen"],
                    "duration_months": 48,
                    "portfolio_items": ["System architecture", "Team leadership"],
                    "advancement_opportunities": ["Principal Engineer", "CTO"]
                }
            ]
        }
    
    def _get_fallback_interview_prep(self, target_role: str) -> Dict:
        """Get fallback interview preparation"""
        return {
            "common_questions": [
                "Tell me about yourself",
                "Why do you want this role?",
                "What are your strengths and weaknesses?",
                "Where do you see yourself in 5 years?"
            ],
            "technical_skills": [
                "Programming fundamentals",
                "Problem solving",
                "System design",
                "Data structures and algorithms"
            ],
            "behavioral_questions": [
                "Describe a challenging project you worked on",
                "How do you handle conflicts in a team?",
                "Tell me about a time you failed and what you learned"
            ],
            "portfolio_suggestions": [
                "Personal website",
                "Open source contributions",
                "Side projects",
                "Technical blog"
            ],
            "interview_tips": [
                "Research the company thoroughly",
                "Practice coding problems",
                "Prepare questions to ask",
                "Dress professionally"
            ],
            "salary_negotiation": [
                "Research market rates",
                "Know your worth",
                "Consider total compensation",
                "Be prepared to negotiate"
            ]
        }
    
    def _get_fallback_market_insights(self, role_data: pd.Series) -> Dict:
        """Get fallback market insights"""
        return {
            "market_demand": "High" if role_data['growth_pct'] > 10 else "Moderate",
            "salary_trends": "Growing" if role_data['growth_pct'] > 15 else "Stable",
            "required_skills": "Evolving",
            "industry_outlook": "Positive",
            "geographic_opportunities": "Remote-friendly",
            "emerging_technologies": ["AI/ML", "Cloud Computing", "DevOps"],
            "career_advancement": "Strong growth potential"
        }
    
    def _get_fallback_learning_plan(self) -> Dict:
        """Get fallback learning plan"""
        return {
            "skill_gaps": ["python", "javascript", "api"],
            "recommended_lessons": [],
            "estimated_duration_hours": 120,
            "learning_strategy": "Focus on hands-on projects",
            "priority_skills": ["python", "javascript"]
        }
    
    def _get_fallback_coaching_advice(self, target_role: str) -> Dict:
        """Get fallback coaching advice"""
        return {
            "career_development": [
                "Focus on building practical skills",
                "Network with professionals in your field",
                "Seek mentorship opportunities"
            ],
            "skill_development": [
                "Prioritize hands-on projects",
                "Stay updated with industry trends",
                "Practice problem-solving regularly"
            ],
            "networking": [
                "Attend industry events",
                "Join professional communities",
                "Build online presence"
            ],
            "work_life_balance": [
                "Set clear boundaries",
                "Take regular breaks",
                "Maintain healthy habits"
            ]
        }
    
    def _get_fallback_roadmap(self, target_role: Optional[str], user_skills: Optional[List[str]], user_interests: Optional[List[str]]) -> Dict:
        """Get fallback unified roadmap"""
        return {
            "target_role": target_role or "Software Developer",
            "roadmap": self._create_fallback_roadmap(target_role or "Software Developer"),
            "interview_preparation": self._get_fallback_interview_prep(target_role or "Software Developer"),
            "market_insights": {"market_demand": "High", "salary_trends": "Growing"},
            "learning_plan": self._get_fallback_learning_plan(),
            "coaching_advice": self._get_fallback_coaching_advice(target_role or "Software Developer"),
            "confidence_score": 0.6,
            "timeline": {"total_duration_months": 36, "milestones": []},
            "estimated_time_to_target": {"estimated_months": 36, "estimated_years": 3.0}
        }

# Global instance
unified_career_system = UnifiedCareerSystem() 