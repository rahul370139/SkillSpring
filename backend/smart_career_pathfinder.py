"""
Smart Career Pathfinder - Adaptive skill suggestions for career discovery
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from pathlib import Path

import pandas as pd
import numpy as np
from loguru import logger
from groq import Groq

from schemas import (
    SmartCareerRequest, SmartCareerResponse, SkillSuggestionRequest, 
    SkillSuggestionResponse, CareerDiscoveryRequest, CareerDiscoveryResponse
)

class SmartCareerPathfinder:
    """
    Smart career pathfinder with adaptive skill suggestions:
    1. Initial suggestions based on user profile
    2. Adaptive skill suggestions based on previous selections
    3. Career recommendations based on skill combinations
    """
    
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.data_path = Path(__file__).parent / "data"
        
        # Load career data
        self.career_data = self._load_career_data()
        
        # Skill relationships and suggestions
        self.skill_relationships = self._create_skill_relationships()
        self.interest_skill_mappings = self._create_interest_skill_mappings()
        
        logger.info("SmartCareerPathfinder initialized successfully")
    
    def _load_career_data(self) -> pd.DataFrame:
        """Load career data from processed CSV"""
        try:
            df = pd.read_csv(self.data_path / "onet_bls_trimmed.csv")
            logger.info(f"Loaded {len(df)} careers")
            return df
        except FileNotFoundError:
            logger.warning("Career data not found, using sample data")
            return self._create_sample_career_data()
    
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
    
    def _create_skill_relationships(self) -> Dict:
        """Create skill relationships for smart suggestions"""
        return {
            "python": {
                "related_skills": ["django", "flask", "api", "data_analysis", "ml", "automation", "testing"],
                "career_paths": ["Software Developer", "Data Scientist", "Backend Developer"],
                "difficulty": "beginner",
                "category": "Programming"
            },
            "javascript": {
                "related_skills": ["react", "nodejs", "typescript", "frontend", "api", "web_development", "vue"],
                "career_paths": ["Frontend Developer", "Full Stack Developer", "Web Developer"],
                "difficulty": "beginner",
                "category": "Programming"
            },
            "react": {
                "related_skills": ["javascript", "typescript", "redux", "frontend", "ui_ux", "web_development", "nextjs"],
                "career_paths": ["Frontend Developer", "React Developer", "UI Developer"],
                "difficulty": "intermediate",
                "category": "Web Development"
            },
            "api": {
                "related_skills": ["python", "javascript", "nodejs", "database", "rest", "graphql", "postman"],
                "career_paths": ["Backend Developer", "API Developer", "Full Stack Developer"],
                "difficulty": "intermediate",
                "category": "Backend Development"
            },
            "ml": {
                "related_skills": ["python", "statistics", "data_analysis", "deep_learning", "ai", "tensorflow", "pytorch"],
                "career_paths": ["Data Scientist", "ML Engineer", "AI Developer"],
                "difficulty": "advanced",
                "category": "Data Science"
            },
            "docker": {
                "related_skills": ["devops", "aws", "kubernetes", "ci_cd", "deployment", "containers"],
                "career_paths": ["DevOps Engineer", "Cloud Engineer", "Infrastructure Engineer"],
                "difficulty": "intermediate",
                "category": "DevOps"
            },
            "aws": {
                "related_skills": ["cloud", "devops", "docker", "kubernetes", "infrastructure", "serverless"],
                "career_paths": ["Cloud Engineer", "DevOps Engineer", "Infrastructure Engineer"],
                "difficulty": "intermediate",
                "category": "Cloud"
            },
            "database": {
                "related_skills": ["sql", "nosql", "api", "backend", "data_modeling", "postgresql", "mongodb"],
                "career_paths": ["Backend Developer", "Database Developer", "Data Engineer"],
                "difficulty": "intermediate",
                "category": "Database"
            },
            "ui_ux": {
                "related_skills": ["design", "frontend", "react", "figma", "user_research", "prototyping"],
                "career_paths": ["UI/UX Designer", "Frontend Developer", "Product Designer"],
                "difficulty": "intermediate",
                "category": "Design"
            },
            "devops": {
                "related_skills": ["docker", "aws", "kubernetes", "ci_cd", "automation", "jenkins"],
                "career_paths": ["DevOps Engineer", "Cloud Engineer", "Infrastructure Engineer"],
                "difficulty": "advanced",
                "category": "DevOps"
            },
            "statistics": {
                "related_skills": ["python", "data_analysis", "ml", "r", "excel", "visualization"],
                "career_paths": ["Data Scientist", "Data Analyst", "Business Analyst"],
                "difficulty": "intermediate",
                "category": "Data Science"
            },
            "testing": {
                "related_skills": ["python", "javascript", "selenium", "unit_testing", "qa", "automation"],
                "career_paths": ["QA Engineer", "Test Engineer", "Software Developer"],
                "difficulty": "intermediate",
                "category": "Testing"
            }
        }
    
    def _create_interest_skill_mappings(self) -> Dict:
        """Create mappings from interests to suggested skills"""
        return {
            "Technology": {
                "initial_skills": ["python", "javascript", "programming"],
                "career_paths": ["Software Developer", "Full Stack Developer", "Backend Developer"],
                "description": "Build software and applications"
            },
            "Design": {
                "initial_skills": ["ui_ux", "design", "frontend", "react"],
                "career_paths": ["UI/UX Designer", "Frontend Developer", "Product Designer"],
                "description": "Create beautiful user experiences"
            },
            "Data Science": {
                "initial_skills": ["python", "statistics", "data_analysis", "ml"],
                "career_paths": ["Data Scientist", "ML Engineer", "Data Analyst"],
                "description": "Analyze data and build AI models"
            },
            "Marketing": {
                "initial_skills": ["digital_marketing", "seo", "content_creation", "analytics"],
                "career_paths": ["Digital Marketing Specialist", "SEO Specialist", "Marketing Analyst"],
                "description": "Promote products and services"
            },
            "DevOps": {
                "initial_skills": ["docker", "aws", "devops", "automation"],
                "career_paths": ["DevOps Engineer", "Cloud Engineer", "Infrastructure Engineer"],
                "description": "Manage infrastructure and deployments"
            },
            "Mobile Development": {
                "initial_skills": ["react_native", "flutter", "mobile", "app_development"],
                "career_paths": ["Mobile Developer", "React Native Developer", "iOS/Android Developer"],
                "description": "Build mobile applications"
            }
        }
    
    async def get_initial_suggestions(self, user_profile: Optional[Dict] = None) -> Dict:
        """Get initial suggestions based on user profile or default options"""
        
        if user_profile:
            # Analyze user profile to suggest relevant interests
            experience_level = user_profile.get("experience_level", "entry")
            current_role = user_profile.get("current_role", "")
            
            # Suggest interests based on current role
            role_interest_mapping = {
                "developer": ["Technology", "DevOps"],
                "designer": ["Design", "Technology"],
                "analyst": ["Data Science", "Technology"],
                "marketing": ["Marketing", "Data Science"],
                "student": ["Technology", "Design", "Data Science"]
            }
            
            suggested_interests = []
            for role_keyword, interests in role_interest_mapping.items():
                if role_keyword.lower() in current_role.lower():
                    suggested_interests.extend(interests)
            
            if not suggested_interests:
                suggested_interests = ["Technology", "Design", "Data Science"]
        else:
            suggested_interests = ["Technology", "Design", "Data Science", "Marketing", "DevOps"]
        
        # Get initial skills for each suggested interest
        initial_skills = {}
        for interest in suggested_interests:
            if interest in self.interest_skill_mappings:
                mapping = self.interest_skill_mappings[interest]
                initial_skills[interest] = {
                    "skills": mapping["initial_skills"],
                    "career_paths": mapping["career_paths"],
                    "description": mapping["description"]
                }
        
        return {
            "suggested_interests": suggested_interests,
            "initial_skills": initial_skills,
            "message": "Select an interest to get started, or choose from our suggestions below."
        }
    
    async def suggest_next_skills(
        self, 
        selected_interests: List[str], 
        selected_skills: List[str],
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """Suggest next skills based on current selections"""
        
        # Analyze current selections
        all_related_skills = set()
        career_paths = set()
        skill_categories = {}
        
        # Get related skills from current selections
        for skill in selected_skills:
            if skill in self.skill_relationships:
                related = self.skill_relationships[skill]["related_skills"]
                all_related_skills.update(related)
                career_paths.update(self.skill_relationships[skill]["career_paths"])
                
                # Track categories
                category = self.skill_relationships[skill]["category"]
                if category not in skill_categories:
                    skill_categories[category] = []
                skill_categories[category].extend(related)
        
        # Get skills from selected interests
        for interest in selected_interests:
            if interest in self.interest_skill_mappings:
                mapping = self.interest_skill_mappings[interest]
                all_related_skills.update(mapping["initial_skills"])
                career_paths.update(mapping["career_paths"])
        
        # Remove already selected skills
        suggested_skills = list(all_related_skills - set(selected_skills))
        
        # Prioritize suggestions based on user profile
        if user_profile:
            experience_level = user_profile.get("experience_level", "entry")
            if experience_level == "entry":
                # Suggest beginner-friendly skills first
                beginner_skills = [skill for skill in suggested_skills 
                                 if self.skill_relationships.get(skill, {}).get("difficulty") == "beginner"]
                suggested_skills = beginner_skills + [s for s in suggested_skills if s not in beginner_skills]
        
        # Group suggestions by category
        categorized_suggestions = {}
        for category, skills in skill_categories.items():
            category_skills = [skill for skill in suggested_skills if skill in skills]
            if category_skills:
                categorized_suggestions[category] = category_skills[:3]  # Top 3 per category
        
        # Add any remaining skills to "Other" category
        other_skills = [skill for skill in suggested_skills if skill not in [s for skills in categorized_suggestions.values() for s in skills]]
        if other_skills:
            categorized_suggestions["Other"] = other_skills[:3]
        
        return {
            "suggested_skills": suggested_skills[:10],  # Top 10 overall
            "categorized_suggestions": categorized_suggestions,
            "career_paths": list(career_paths)[:5],  # Top 5 career paths
            "message": f"Based on your selections ({', '.join(selected_skills)}), here are skills that would complement your profile:"
        }
    
    async def discover_careers(
        self,
        selected_interests: List[str],
        selected_skills: List[str],
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """Discover career paths based on selected interests and skills"""
        
        try:
            # Calculate skill-based career matches
            career_scores = {}
            
            for _, career in self.career_data.iterrows():
                required_skills = career['top_skills'].split(',')
                skill_match = len(set(selected_skills) & set(required_skills)) / len(required_skills)
                
                # Consider interest alignment
                interest_bonus = 0.1 if any(interest.lower() in career['title'].lower() for interest in selected_interests) else 0
                
                final_score = skill_match + interest_bonus
                career_scores[career['title']] = {
                    'score': final_score,
                    'skill_match': skill_match,
                    'salary_range': {'min': career['salary_low'], 'max': career['salary_high']},
                    'growth_pct': career['growth_pct'],
                    'required_skills': required_skills,
                    'day_in_life': career['day_in_life']
                }
            
            # Sort by score and get top matches
            sorted_careers = sorted(career_scores.items(), key=lambda x: x[1]['score'], reverse=True)
            top_careers = sorted_careers[:5]
            
            # Generate personalized insights
            insights = await self._generate_career_insights(selected_skills, selected_interests, user_profile)
            
            return {
                "recommended_careers": [
                    {
                        "title": career[0],
                        "score": round(career[1]['score'], 3),
                        "skill_match": round(career[1]['skill_match'] * 100, 1),
                        "salary_range": career[1]['salary_range'],
                        "growth_pct": career[1]['growth_pct'],
                        "required_skills": career[1]['required_skills'],
                        "day_in_life": career[1]['day_in_life']
                    }
                    for career in top_careers
                ],
                "insights": insights,
                "skill_analysis": {
                    "total_skills": len(selected_skills),
                    "skill_categories": list(set(self.skill_relationships.get(skill, {}).get("category", "Other") for skill in selected_skills)),
                    "experience_level": self._assess_experience_level(selected_skills, user_profile)
                }
            }
            
        except Exception as e:
            logger.error(f"Error discovering careers: {e}")
            return self._get_fallback_career_discovery(selected_interests, selected_skills)
    
    async def _generate_career_insights(
        self, 
        selected_skills: List[str], 
        selected_interests: List[str], 
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """Generate personalized career insights"""
        
        # Analyze skill distribution
        skill_categories = {}
        for skill in selected_skills:
            if skill in self.skill_relationships:
                category = self.skill_relationships[skill]["category"]
                skill_categories[category] = skill_categories.get(category, 0) + 1
        
        # Determine primary focus area
        primary_focus = max(skill_categories.items(), key=lambda x: x[1])[0] if skill_categories else "General"
        
        # Generate insights based on focus area
        insights = {
            "primary_focus": primary_focus,
            "strength_areas": list(skill_categories.keys()),
            "recommendations": [
                f"Your skills align well with {primary_focus} roles",
                f"Consider exploring {', '.join(selected_interests)} focused careers",
                "Focus on building depth in your strongest areas"
            ],
            "next_steps": [
                "Research the recommended career paths",
                "Identify skill gaps for your target roles",
                "Build portfolio projects in your focus area"
            ]
        }
        
        return insights
    
    def _assess_experience_level(self, selected_skills: List[str], user_profile: Optional[Dict] = None) -> str:
        """Assess user's experience level based on skills"""
        
        if user_profile and user_profile.get("experience_level"):
            return user_profile["experience_level"]
        
        # Count advanced skills
        advanced_skills = [skill for skill in selected_skills 
                          if self.skill_relationships.get(skill, {}).get("difficulty") == "advanced"]
        
        if len(advanced_skills) >= 3:
            return "senior"
        elif len(advanced_skills) >= 1:
            return "mid"
        else:
            return "entry"
    
    def _get_fallback_career_discovery(self, selected_interests: List[str], selected_skills: List[str]) -> Dict:
        """Get fallback career discovery results"""
        return {
            "recommended_careers": [
                {
                    "title": "Software Developer",
                    "score": 0.7,
                    "skill_match": 70.0,
                    "salary_range": {"min": 60000, "max": 120000},
                    "growth_pct": 15.0,
                    "required_skills": ["python", "javascript", "api"],
                    "day_in_life": "Develop software applications and systems"
                }
            ],
            "insights": {
                "primary_focus": "Technology",
                "strength_areas": ["Programming"],
                "recommendations": ["Focus on building practical projects"],
                "next_steps": ["Learn additional skills", "Build portfolio"]
            },
            "skill_analysis": {
                "total_skills": len(selected_skills),
                "skill_categories": ["Programming"],
                "experience_level": "entry"
            }
        }

# Global instance
smart_pathfinder = SmartCareerPathfinder() 