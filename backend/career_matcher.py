import pandas as pd
import numpy as np
import os
import math
from loguru import logger
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import json

# RIASEC interest dimensions
RIASEC = ["realistic", "investigative", "artistic", "social", "enterprising", "conventional"]

class CareerMatcher:
    def __init__(self):
        """Initialize career matcher with ONET/BLS data"""
        self.data_path = Path(__file__).parent / "data" / "onet_bls_trimmed.csv"
        self.roadmaps_path = Path(__file__).parent / "data" / "career_roadmaps.json"
        
        if not self.data_path.exists():
            logger.error(f"Career data not found at {self.data_path}")
            logger.error("Please run process_dataset.py to create the career database")
            raise FileNotFoundError(f"Career data file not found: {self.data_path}")
        
        self.df = pd.read_csv(self.data_path)
        logger.info(f"Loaded {len(self.df)} careers for matching")
        
        # Initialize career roadmaps
        self._initialize_roadmaps()
        
        # Create enhanced feature matrix
        self._create_feature_matrix()
        
        # Normalize interest vectors to unit length for cosine similarity
        self.df[RIASEC] = self.df[RIASEC].apply(
            lambda col: (col - col.mean()) / (col.std() + 1e-9)
        )
        self.df["vec_norm"] = np.linalg.norm(self.df[RIASEC].values, axis=1)
        
        # Ensure all required columns exist
        required_cols = ["soc_code", "title", "salary_low", "salary_high", "growth_pct", 
                        "top_skills", "day_in_life"] + RIASEC
        missing_cols = [col for col in required_cols if col not in self.df.columns]
        if missing_cols:
            logger.error(f"Missing required columns in career data: {missing_cols}")
            raise ValueError(f"Career data is missing required columns: {missing_cols}")

    def _initialize_roadmaps(self):
        """Initialize career roadmaps with learning paths"""
        if not self.roadmaps_path.exists():
            self._create_default_roadmaps()
        
        with open(self.roadmaps_path, 'r') as f:
            self.roadmaps = json.load(f)
        logger.info(f"Loaded {len(self.roadmaps)} career roadmaps")

    def _create_default_roadmaps(self):
        """Create default career roadmaps with learning paths"""
        roadmaps = {
            "Software Developer": {
                "entry_level": {
                    "title": "Junior Developer",
                    "skills": ["Python", "JavaScript", "Git", "Basic Algorithms"],
                    "courses": ["Python Fundamentals", "Web Development Basics", "Version Control"],
                    "duration": "6-12 months",
                    "salary_range": "$60,000 - $80,000"
                },
                "mid_level": {
                    "title": "Software Developer",
                    "skills": ["Full-Stack Development", "Database Design", "API Development", "Testing"],
                    "courses": ["Advanced Web Development", "Database Systems", "API Design", "Testing Strategies"],
                    "duration": "2-3 years",
                    "salary_range": "$80,000 - $120,000"
                },
                "senior_level": {
                    "title": "Senior Developer",
                    "skills": ["System Architecture", "Team Leadership", "Performance Optimization", "DevOps"],
                    "courses": ["System Design", "Leadership Skills", "DevOps Practices", "Advanced Algorithms"],
                    "duration": "5+ years",
                    "salary_range": "$120,000 - $180,000"
                }
            },
            "Data Scientist": {
                "entry_level": {
                    "title": "Data Analyst",
                    "skills": ["SQL", "Python", "Excel", "Basic Statistics"],
                    "courses": ["Data Analysis Fundamentals", "SQL Mastery", "Python for Data Science"],
                    "duration": "6-12 months",
                    "salary_range": "$65,000 - $85,000"
                },
                "mid_level": {
                    "title": "Data Scientist",
                    "skills": ["Machine Learning", "Statistical Analysis", "Data Visualization", "Big Data Tools"],
                    "courses": ["Machine Learning Fundamentals", "Statistical Analysis", "Data Visualization", "Big Data Technologies"],
                    "duration": "2-4 years",
                    "salary_range": "$85,000 - $130,000"
                },
                "senior_level": {
                    "title": "Senior Data Scientist",
                    "skills": ["Deep Learning", "MLOps", "Team Leadership", "Business Strategy"],
                    "courses": ["Deep Learning", "MLOps", "Leadership Skills", "Business Intelligence"],
                    "duration": "5+ years",
                    "salary_range": "$130,000 - $200,000"
                }
            },
            "DevOps Engineer": {
                "entry_level": {
                    "title": "System Administrator",
                    "skills": ["Linux", "Networking", "Basic Scripting", "Monitoring"],
                    "courses": ["Linux Administration", "Network Fundamentals", "Shell Scripting", "Monitoring Tools"],
                    "duration": "6-12 months",
                    "salary_range": "$70,000 - $90,000"
                },
                "mid_level": {
                    "title": "DevOps Engineer",
                    "skills": ["Docker", "Kubernetes", "CI/CD", "Cloud Platforms"],
                    "courses": ["Containerization", "Kubernetes", "CI/CD Pipelines", "Cloud Computing"],
                    "duration": "2-3 years",
                    "salary_range": "$90,000 - $140,000"
                },
                "senior_level": {
                    "title": "Senior DevOps Engineer",
                    "skills": ["Architecture Design", "Team Leadership", "Security", "Automation"],
                    "courses": ["System Architecture", "Security Best Practices", "Leadership Skills", "Advanced Automation"],
                    "duration": "5+ years",
                    "salary_range": "$140,000 - $200,000"
                }
            },
            "Product Manager": {
                "entry_level": {
                    "title": "Associate Product Manager",
                    "skills": ["Product Strategy", "User Research", "Data Analysis", "Communication"],
                    "courses": ["Product Management Fundamentals", "User Research Methods", "Data Analysis", "Communication Skills"],
                    "duration": "6-12 months",
                    "salary_range": "$75,000 - $95,000"
                },
                "mid_level": {
                    "title": "Product Manager",
                    "skills": ["Product Strategy", "User Experience", "Market Analysis", "Stakeholder Management"],
                    "courses": ["Advanced Product Strategy", "UX Design", "Market Research", "Stakeholder Management"],
                    "duration": "2-4 years",
                    "salary_range": "$95,000 - $150,000"
                },
                "senior_level": {
                    "title": "Senior Product Manager",
                    "skills": ["Strategic Planning", "Team Leadership", "Business Strategy", "Innovation"],
                    "courses": ["Strategic Planning", "Leadership Skills", "Business Strategy", "Innovation Management"],
                    "duration": "5+ years",
                    "salary_range": "$150,000 - $220,000"
                }
            },
            "Cybersecurity Analyst": {
                "entry_level": {
                    "title": "Security Analyst",
                    "skills": ["Network Security", "Security Tools", "Incident Response", "Compliance"],
                    "courses": ["Network Security Fundamentals", "Security Tools", "Incident Response", "Compliance Basics"],
                    "duration": "6-12 months",
                    "salary_range": "$70,000 - $90,000"
                },
                "mid_level": {
                    "title": "Cybersecurity Analyst",
                    "skills": ["Threat Hunting", "Penetration Testing", "Security Architecture", "Risk Assessment"],
                    "courses": ["Threat Hunting", "Penetration Testing", "Security Architecture", "Risk Assessment"],
                    "duration": "2-4 years",
                    "salary_range": "$90,000 - $140,000"
                },
                "senior_level": {
                    "title": "Senior Security Engineer",
                    "skills": ["Security Strategy", "Team Leadership", "Advanced Threats", "Compliance"],
                    "courses": ["Security Strategy", "Leadership Skills", "Advanced Threat Analysis", "Compliance Management"],
                    "duration": "5+ years",
                    "salary_range": "$140,000 - $200,000"
                }
            }
        }
        
        # Create data directory if it doesn't exist
        self.roadmaps_path.parent.mkdir(exist_ok=True)
        
        with open(self.roadmaps_path, 'w') as f:
            json.dump(roadmaps, f, indent=2)
        
        logger.info(f"Created default career roadmaps with {len(roadmaps)} career paths")

    def _create_feature_matrix(self):
        """Create enhanced feature matrix for sophisticated matching"""
        # Extract skills as features
        all_skills = set()
        for skills_str in self.df['top_skills'].dropna():
            skills = [skill.strip() for skill in skills_str.split(',')]
            all_skills.update(skills)
        
        # Create skill features
        for skill in all_skills:
            self.df[f'skill_{skill.lower().replace(" ", "_")}'] = self.df['top_skills'].str.contains(skill, case=False, na=False).astype(int)
        
        # Create salary level features
        self.df['salary_level'] = pd.cut(self.df['salary_high'], bins=5, labels=['Entry', 'Junior', 'Mid', 'Senior', 'Expert'])
        
        # Create growth category features
        self.df['growth_category'] = pd.cut(self.df['growth_pct'], bins=3, labels=['Low', 'Medium', 'High'])
        
        # Create experience level features based on title
        self.df['experience_level'] = self.df['title'].apply(self._extract_experience_level)
        
        logger.info(f"Created enhanced feature matrix with {len(all_skills)} skill features")

    def _extract_experience_level(self, title):
        """Extract experience level from job title"""
        title_lower = title.lower()
        if any(word in title_lower for word in ['senior', 'lead', 'principal', 'architect']):
            return 'senior'
        elif any(word in title_lower for word in ['junior', 'assistant', 'trainee']):
            return 'entry'
        else:
            return 'mid'

    @staticmethod
    def answers_to_vec(answers: List[int]) -> np.ndarray:
        """Convert quiz answers to RIASEC interest vector"""
        assert len(answers) == 10, f"Expected 10 answers, got {len(answers)}"
        
        # Initialize RIASEC scores
        v = dict.fromkeys(RIASEC, 0.0)
        
        # Question mapping to RIASEC dimensions
        mapping = {
            0: ["realistic"],      # Repairing mechanical things
            1: ["investigative"],  # Solving complex problems
            2: ["artistic"],       # Creating art/graphics
            3: ["social"],         # Teaching/helping people
            4: ["enterprising"],   # Leading teams
            5: ["conventional"],   # Organizing information
            6: ["realistic"],      # Working outdoors
            7: ["investigative"],  # Designing experiments
            8: ["artistic", "social"],  # Performing/presenting
            9: ["conventional", "enterprising"],  # Planning budgets
        }
        
        # Add answers to corresponding RIASEC dimensions
        for i, val in enumerate(answers):
            for dimension in mapping[i]:
                v[dimension] += val
        
        # Convert to numpy array
        vec = np.array([v[k] for k in RIASEC], dtype=float)
        
        # Z-scale to align with job vectors
        vec = (vec - vec.mean()) / (vec.std() + 1e-9)
        return vec

    def enhanced_top_matches(self, answers: List[int], k: int = 5, user_profile: Dict = None) -> List[Dict]:
        """Find top k career matches using sophisticated algorithms"""
        try:
            # Convert answers to user vector
            user_vec = self.answers_to_vec(answers)
            
            # Calculate multiple similarity scores
            scores = self._calculate_comprehensive_scores(user_vec, user_profile)
            
            # Combine scores using weighted average
            final_scores = self._combine_scores(scores, user_profile)
            
            # Get top matches
            self.df['final_score'] = final_scores
            top = (
                self.df.sort_values("final_score", ascending=False)
                .head(k)
                .to_dict(orient="records")
            )
            
            # Add roadmap information
            for match in top:
                match['roadmap'] = self.get_career_roadmap(match['title'])
            
            logger.info(f"Found {len(top)} enhanced career matches for user")
            return top
            
        except Exception as e:
            logger.error(f"Error in enhanced career matching: {e}")
            return []

    def _calculate_comprehensive_scores(self, user_vec: np.ndarray, user_profile: Dict = None) -> Dict[str, np.ndarray]:
        """Calculate multiple similarity scores"""
        scores = {}
        
        # 1. RIASEC similarity (cosine)
        user_norm = np.linalg.norm(user_vec) or 1.0
        dots = self.df[RIASEC].values @ user_vec
        scores['riasec'] = dots / (self.df["vec_norm"] * user_norm)
        
        # 2. Skill-based similarity
        if user_profile and 'skills' in user_profile:
            skill_scores = self._calculate_skill_similarity(user_profile['skills'])
            scores['skills'] = skill_scores
        else:
            scores['skills'] = np.zeros(len(self.df))
        
        # 3. Experience level preference
        if user_profile and 'experience_level' in user_profile:
            exp_scores = self._calculate_experience_similarity(user_profile['experience_level'])
            scores['experience'] = exp_scores
        else:
            scores['experience'] = np.zeros(len(self.df))
        
        # 4. Salary preference
        if user_profile and 'salary_preference' in user_profile:
            salary_scores = self._calculate_salary_similarity(user_profile['salary_preference'])
            scores['salary'] = salary_scores
        else:
            scores['salary'] = np.zeros(len(self.df))
        
        # 5. Growth preference
        if user_profile and 'growth_preference' in user_profile:
            growth_scores = self._calculate_growth_similarity(user_profile['growth_preference'])
            scores['growth'] = growth_scores
        else:
            scores['growth'] = np.zeros(len(self.df))
        
        return scores

    def _calculate_skill_similarity(self, user_skills: List[str]) -> np.ndarray:
        """Calculate skill-based similarity"""
        skill_cols = [col for col in self.df.columns if col.startswith('skill_')]
        if not skill_cols:
            return np.zeros(len(self.df))
        
        # Create user skill vector
        user_skill_vec = np.zeros(len(skill_cols))
        for skill in user_skills:
            skill_col = f'skill_{skill.lower().replace(" ", "_")}'
            if skill_col in self.df.columns:
                idx = skill_cols.index(skill_col)
                user_skill_vec[idx] = 1
        
        # Calculate cosine similarity
        skill_matrix = self.df[skill_cols].values
        similarities = cosine_similarity([user_skill_vec], skill_matrix)[0]
        return similarities

    def _calculate_experience_similarity(self, preferred_level: str) -> np.ndarray:
        """Calculate experience level similarity"""
        level_mapping = {'entry': 0, 'mid': 1, 'senior': 2}
        preferred_score = level_mapping.get(preferred_level, 1)
        
        current_levels = self.df['experience_level'].map(level_mapping)
        similarities = 1 - np.abs(current_levels - preferred_score) / 2
        return similarities.fillna(0).values

    def _calculate_salary_similarity(self, salary_preference: str) -> np.ndarray:
        """Calculate salary preference similarity"""
        if salary_preference == 'high':
            return self.df['salary_high'] / self.df['salary_high'].max()
        elif salary_preference == 'low':
            return 1 - (self.df['salary_low'] / self.df['salary_low'].max())
        else:  # medium
            mid_salary = (self.df['salary_low'] + self.df['salary_high']) / 2
            return 1 - np.abs(mid_salary - mid_salary.mean()) / mid_salary.std()

    def _calculate_growth_similarity(self, growth_preference: str) -> np.ndarray:
        """Calculate growth preference similarity"""
        if growth_preference == 'high':
            return self.df['growth_pct'] / self.df['growth_pct'].max()
        elif growth_preference == 'low':
            return 1 - (self.df['growth_pct'] / self.df['growth_pct'].max())
        else:  # medium
            return 1 - np.abs(self.df['growth_pct'] - self.df['growth_pct'].mean()) / self.df['growth_pct'].std()

    def _combine_scores(self, scores: Dict[str, np.ndarray], user_profile: Dict = None) -> np.ndarray:
        """Combine multiple scores using weighted average"""
        weights = {
            'riasec': 0.4,      # Primary weight for interest matching
            'skills': 0.25,      # Skill alignment
            'experience': 0.15,  # Experience level preference
            'salary': 0.1,       # Salary preference
            'growth': 0.1        # Growth preference
        }
        
        # Adjust weights based on user profile
        if user_profile:
            if 'skills' in user_profile and user_profile['skills']:
                weights['skills'] += 0.1
                weights['riasec'] -= 0.05
            if 'experience_level' in user_profile:
                weights['experience'] += 0.05
                weights['riasec'] -= 0.05
        
        # Normalize scores to 0-1 range
        normalized_scores = {}
        for key, score_array in scores.items():
            if len(score_array) > 0 and score_array.max() != score_array.min():
                normalized_scores[key] = (score_array - score_array.min()) / (score_array.max() - score_array.min())
            else:
                normalized_scores[key] = score_array
        
        # Combine scores
        final_score = np.zeros(len(self.df))
        for key, weight in weights.items():
            if key in normalized_scores:
                final_score += weight * normalized_scores[key]
        
        return final_score

    def get_career_roadmap(self, career_title: str) -> Dict:
        """Get career roadmap for a specific career"""
        # Find the best matching roadmap
        best_match = None
        best_score = 0
        
        for roadmap_title in self.roadmaps.keys():
            score = self._calculate_title_similarity(career_title, roadmap_title)
            if score > best_score:
                best_score = score
                best_match = roadmap_title
        
        if best_match and best_score > 0.3:  # Threshold for similarity
            return self.roadmaps[best_match]
        else:
            # Return a generic roadmap
            return {
                "entry_level": {
                    "title": "Entry Level",
                    "skills": ["Basic technical skills", "Problem solving", "Communication"],
                    "courses": ["Fundamentals", "Basic Skills", "Communication"],
                    "duration": "6-12 months",
                    "salary_range": "$50,000 - $70,000"
                },
                "mid_level": {
                    "title": "Mid Level",
                    "skills": ["Advanced technical skills", "Leadership", "Project management"],
                    "courses": ["Advanced Skills", "Leadership", "Project Management"],
                    "duration": "2-4 years",
                    "salary_range": "$70,000 - $120,000"
                },
                "senior_level": {
                    "title": "Senior Level",
                    "skills": ["Expertise", "Strategic thinking", "Team leadership"],
                    "courses": ["Expert Skills", "Strategic Planning", "Leadership"],
                    "duration": "5+ years",
                    "salary_range": "$120,000 - $200,000"
                }
            }

    def _calculate_title_similarity(self, title1: str, title2: str) -> float:
        """Calculate similarity between two job titles"""
        words1 = set(title1.lower().split())
        words2 = set(title2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)

    def top_matches(self, answers: List[int], k: int = 5) -> List[Dict]:
        """Find top k career matches based on quiz answers (legacy method)"""
        return self.enhanced_top_matches(answers, k)

    def get_quiz_questions(self) -> List[Dict]:
        """Get the 10 career quiz questions"""
        questions = [
            {
                "id": 0,
                "question": "Repairing or assembling mechanical things",
                "category": "Realistic",
                "description": "Rate how much you enjoy working with tools, machines, or physical systems"
            },
            {
                "id": 1,
                "question": "Solving complex scientific or mathematical problems",
                "category": "Investigative",
                "description": "Rate how much you enjoy analyzing data, conducting research, or solving puzzles"
            },
            {
                "id": 2,
                "question": "Creating art, graphics, music, or creative writing",
                "category": "Artistic",
                "description": "Rate how much you enjoy expressing creativity and imagination"
            },
            {
                "id": 3,
                "question": "Teaching, counseling, or helping people directly",
                "category": "Social",
                "description": "Rate how much you enjoy working with and helping others"
            },
            {
                "id": 4,
                "question": "Leading teams and persuading others to a vision",
                "category": "Enterprising",
                "description": "Rate how much you enjoy taking charge and influencing others"
            },
            {
                "id": 5,
                "question": "Organizing information, spreadsheets, or records",
                "category": "Conventional",
                "description": "Rate how much you enjoy working with data and following procedures"
            },
            {
                "id": 6,
                "question": "Working outdoors or with your hands",
                "category": "Realistic",
                "description": "Rate how much you enjoy physical work and outdoor activities"
            },
            {
                "id": 7,
                "question": "Designing experiments or digging into data patterns",
                "category": "Investigative",
                "description": "Rate how much you enjoy research and analytical work"
            },
            {
                "id": 8,
                "question": "Performing or presenting to an audience",
                "category": "Artistic/Social",
                "description": "Rate how much you enjoy public speaking and performance"
            },
            {
                "id": 9,
                "question": "Planning budgets, processes, or detailed procedures",
                "category": "Conventional/Enterprising",
                "description": "Rate how much you enjoy planning and organizing"
            }
        ]
        return questions

# Initialize global career matcher instance
matcher = CareerMatcher()
logger.info(f"Career matcher initialized with {len(matcher.df)} careers") 