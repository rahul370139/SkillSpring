from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import asyncio, tempfile, os, json
from pathlib import Path
from schemas import (
    DistillRequest, DistillResponse, LessonCompletion, UserRole, 
    RecommendationRequest, ExplanationLevel, Framework, ChatMessage, 
    ChatResponse, ChatWithFileRequest, ConversationHistory, ChatFileUpload,
    CareerMatchRequest, CareerMatchResponse, CareerCard, CareerQuizResponse, CareerQuizQuestion,
    RoadmapRequest, RoadmapResponse, LessonSearchRequest, LessonSearchResponse,
    CareerGuidanceRequest, CareerGuidanceResponse, InterviewSimulationRequest, InterviewSimulationResponse,
    InterviewAnswerRequest, InterviewAnswerResponse, CareerAdviceRequest, CareerAdviceResponse,
    UserProfileRequest, PersonalizedRecommendationsResponse, MarketTrendsResponse, LearningPathsResponse, 
    VisualRoadmapRequest, VisualRoadmapResponse, UserAnalyticsResponse, CareerPlanningRequest, 
    CareerPlanningResponse, CareerRoadmapRequest, CareerRoadmapResponse, PredefinedOptionsResponse,
    ComprehensiveCareerPlanRequest, ComprehensiveCareerPlanResponse,
    SmartCareerRequest, SmartCareerResponse, SkillSuggestionRequest, SkillSuggestionResponse,
    InterviewPrepRequest, InterviewPrepResponse,
    UnifiedRoadmapRequest, UnifiedRoadmapResponse, CareerDiscoveryRequest, CareerDiscoveryResponse
)
from distiller import (
    pdf_to_text, chunk_text, embed_chunks, detect_framework,
    map_reduce_summary, gen_flashcards_quiz, generate_concept_map,
    get_role_based_recommendations, process_chat_message, process_file_for_chat,
    get_conversation_history, get_user_conversations
)
from supabase_helper import (
    insert_lesson, insert_cards, insert_concept_map, mark_lesson_completed,
    get_user_completed_lessons, upsert_user_role, get_user_role,
    get_lessons_by_framework, get_user_progress_stats
)
from career_matcher import matcher
from smart_career_pathfinder import smart_pathfinder
from unified_career_system import unified_career_system
from dotenv import load_dotenv
from typing import Optional, Dict

load_dotenv()

app = FastAPI(title="TrainPi Microlearning API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later
    allow_methods=["POST", "GET", "PUT"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "TrainPI API is running", "status": "healthy", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TrainPI API", "timestamp": "2024-08-01"}

@app.post("/api/distill", response_model=DistillResponse)
async def distill_pdf(
    owner_id: str = Query(..., description="Supabase user UUID"),
    explanation_level: ExplanationLevel = Query(ExplanationLevel.INTERN, description="Explanation complexity level"),
    framework: Framework = Query(Framework.GENERIC, description="Primary framework/tool category"),
    file: UploadFile = File(...)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "PDF only")
    
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.write(await file.read())
        tmp.close()
        
        text = pdf_to_text(Path(tmp.name))
        chunks = chunk_text(text)
        logger.info(f"{len(chunks)} chunks created")
        
        # Auto-detect framework if not specified
        if framework == Framework.GENERIC:
            framework = await detect_framework(text)
            logger.info(f"Auto-detected framework: {framework}")
        
        embeds = await embed_chunks(chunks)
        summary = await map_reduce_summary(chunks, explanation_level)
        qa = await gen_flashcards_quiz(summary, explanation_level)
        concept_map = await generate_concept_map(summary)
        
    except RuntimeError as e:
        logger.error(f"Processing failed: {e}")
        raise HTTPException(500, str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(500, "Internal server error.")
    
    try:
        lesson_id = insert_lesson(owner_id, file.filename, summary, framework, explanation_level)
        
        # Insert concept map
        insert_concept_map(lesson_id, concept_map)
        
        card_rows = []
        for i, b in enumerate(summary.split("•")):
            if b.strip():
                card_rows.append(
                    {
                        "lesson_id": lesson_id,
                        "card_type": "bullet",
                        "payload": {"order": i, "text": b.strip()},
                        "embed_vector": embeds[min(i, len(embeds)-1)],
                    }
                )
        for fc in qa["flashcards"]:
            card_rows.append(
                {
                    "lesson_id": lesson_id,
                    "card_type": "flashcard",
                    "payload": fc,
                }
            )
        for q in qa["quiz"]:
            card_rows.append(
                {
                    "lesson_id": lesson_id,
                    "card_type": "quiz",
                    "payload": q,
                }
            )
        insert_cards(lesson_id, card_rows)
        
    except Exception as e:
        logger.error(f"Supabase insert failed: {e}")
        raise HTTPException(500, "Failed to save to database.")
    finally:
        os.unlink(tmp.name)
    
    return DistillResponse(
        lesson_id=lesson_id,
        bullets=[b.strip() for b in summary.split("•") if b.strip()],
        flashcards=qa["flashcards"],
        quiz=qa["quiz"],
        concept_map=concept_map,
        framework=framework,
        explanation_level=explanation_level,
    )

# Career matching endpoints
@app.get("/api/career/quiz", response_model=CareerQuizResponse)
async def get_career_quiz():
    """Get the 10 career quiz questions"""
    try:
        questions = matcher.get_quiz_questions()
        quiz_questions = [
            CareerQuizQuestion(
                id=q["id"],
                question=q["question"],
                category=q["category"],
                description=q["description"]
            )
            for q in questions
        ]
        return CareerQuizResponse(questions=quiz_questions)
    except Exception as e:
        logger.error(f"Failed to get career quiz: {e}")
        raise HTTPException(500, "Failed to get career quiz questions.")

@app.post("/api/career/match", response_model=CareerMatchResponse)
async def career_match(request: CareerMatchRequest):
    """Match user quiz answers to career paths using enhanced algorithms"""
    try:
        # Validate answers
        if len(request.answers) != 10:
            raise HTTPException(400, "Need exactly 10 answers")
        if not all(1 <= a <= 5 for a in request.answers):
            raise HTTPException(400, "Answers must be 1-5")

        # Get enhanced career matches
        matches = matcher.enhanced_top_matches(request.answers, k=5, user_profile=request.user_profile)

        # Convert to response format
        cards = []
        for m in matches:
            try:
                # Parse skills (comma-separated string to list)
                skills_str = m.get("top_skills", "technical skills, problem solving, communication")
                common_skills = [skill.strip() for skill in skills_str.split(",")][:3]

                card = CareerCard(
                    title=m["title"],
                    salary_low=int(m["salary_low"]),
                    salary_high=int(m["salary_high"]),
                    growth_pct=float(m["growth_pct"]),
                    common_skills=common_skills,
                    day_in_life=m["day_in_life"],
                    similarity=round(float(m["final_score"]), 3),
                    roadmap=m.get("roadmap")
                )
                cards.append(card)
            except Exception as e:
                logger.error(f"Error processing career match: {e}")
                continue

        logger.info(f"Returning {len(cards)} enhanced career matches for user {request.owner_id}")
        return CareerMatchResponse(results=cards)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Career matching failed: {e}")
        raise HTTPException(500, "Failed to process career matching.")

@app.get("/api/career/roadmap/{career_title}")
async def get_career_roadmap(career_title: str):
    """Get career roadmap for a specific career"""
    try:
        roadmap = matcher.get_career_roadmap(career_title)
        return {"career_title": career_title, "roadmap": roadmap}
    except Exception as e:
        logger.error(f"Failed to get career roadmap: {e}")
        raise HTTPException(500, "Failed to get career roadmap.")

@app.get("/api/career/roadmaps")
async def get_all_roadmaps():
    """Get all available career roadmaps"""
    try:
        return {"roadmaps": matcher.roadmaps}
    except Exception as e:
        logger.error(f"Failed to get roadmaps: {e}")
        raise HTTPException(500, "Failed to get career roadmaps.")

# Chatbot endpoints
@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatMessage):
    """Chat with the AI assistant."""
    try:
        result = await process_chat_message(
            request.user_id, 
            request.message, 
            request.conversation_id, 
            request.explanation_level
        )
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(500, "Failed to process chat message.")

@app.post("/api/chat/upload", response_model=ChatResponse)
async def upload_file_for_chat(
    user_id: str = Query(..., description="User ID"),
    conversation_id: Optional[str] = Query(None, description="Conversation ID"),
    explanation_level: ExplanationLevel = Query(ExplanationLevel.INTERN, description="Explanation level"),
    file: UploadFile = File(...)
):
    """Upload a file and start a conversation about it."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "PDF only")
    
    try:
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp.write(await file.read())
        tmp.close()
        
        result = await process_file_for_chat(
            Path(tmp.name), 
            user_id, 
            conversation_id, 
            explanation_level
        )
        
    except RuntimeError as e:
        logger.error(f"File processing failed: {e}")
        raise HTTPException(500, str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(500, "Internal server error.")
    finally:
        os.unlink(tmp.name)
    
    return ChatResponse(**result)

@app.get("/api/chat/conversations/{user_id}")
async def get_user_chat_conversations(user_id: str):
    """Get all chat conversations for a user."""
    try:
        conversations = get_user_conversations(user_id)
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Failed to get user conversations: {e}")
        raise HTTPException(500, "Failed to get conversations.")

@app.get("/api/chat/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation history."""
    try:
        conversation = get_conversation_history(conversation_id)
        if not conversation:
            raise HTTPException(404, "Conversation not found")
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get conversation: {e}")
        raise HTTPException(500, "Failed to get conversation.")

@app.post("/api/lessons/{lesson_id}/complete")
async def complete_lesson(lesson_id: int, user_id: str, progress_percentage: float = 100.0):
    """Mark a lesson as completed for a user."""
    try:
        mark_lesson_completed(user_id, lesson_id, progress_percentage)
        return {"message": "Lesson marked as completed", "lesson_id": lesson_id}
    except Exception as e:
        logger.error(f"Failed to mark lesson as completed: {e}")
        raise HTTPException(500, "Failed to mark lesson as completed.")

@app.get("/api/users/{user_id}/completed-lessons")
async def get_completed_lessons(user_id: str):
    """Get all completed lessons for a user."""
    try:
        completed_lessons = get_user_completed_lessons(user_id)
        return {"completed_lessons": completed_lessons}
    except Exception as e:
        logger.error(f"Failed to get completed lessons: {e}")
        raise HTTPException(500, "Failed to get completed lessons.")

@app.get("/api/users/{user_id}/progress")
async def get_user_progress(user_id: str):
    """Get user's learning progress statistics."""
    try:
        progress_stats = get_user_progress_stats(user_id)
        return progress_stats
    except Exception as e:
        logger.error(f"Failed to get user progress: {e}")
        raise HTTPException(500, "Failed to get user progress.")

@app.put("/api/users/{user_id}/role")
async def update_user_role(user_id: str, user_role: UserRole):
    """Update user role and preferences."""
    try:
        upsert_user_role(user_id, user_role.role, user_role.experience_level, user_role.interests)
        return {"message": "User role updated successfully"}
    except Exception as e:
        logger.error(f"Failed to update user role: {e}")
        raise HTTPException(500, "Failed to update user role.")

@app.get("/api/users/{user_id}/role")
async def get_user_role_info(user_id: str):
    """Get user role and preferences."""
    try:
        user_role = get_user_role(user_id)
        return {"user_role": user_role}
    except Exception as e:
        logger.error(f"Failed to get user role: {e}")
        raise HTTPException(500, "Failed to get user role.")

@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest):
    """Get personalized lesson recommendations based on user profile."""
    try:
        user_role = get_user_role(request.user_id)
        if not user_role:
            return {"recommendations": []}
        
        recommendations = await get_role_based_recommendations(
            request.user_id,
            user_role.get("role", request.role or "Developer"),
            user_role.get("experience_level", request.experience_level or "Mid"),
            user_role.get("interests", request.interests or [])
        )
        return {"recommendations": recommendations}
    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(500, "Failed to get recommendations.")

@app.get("/api/lessons/framework/{framework}")
async def get_lessons_by_framework_endpoint(framework: Framework, limit: int = 10):
    """Get lessons filtered by framework."""
    try:
        lessons = get_lessons_by_framework(framework, limit)
        return {"lessons": lessons, "framework": framework.value}
    except Exception as e:
        logger.error(f"Failed to get lessons by framework: {e}")
        raise HTTPException(500, "Failed to get lessons by framework.")

@app.get("/api/frameworks")
async def get_available_frameworks():
    """Get all available frameworks for content processing"""
    try:
        frameworks = [framework.value for framework in Framework]
        return {"frameworks": frameworks}
    except Exception as e:
        logger.error(f"Failed to get frameworks: {e}")
        raise HTTPException(500, "Failed to get frameworks")

@app.get("/api/skills")
async def get_available_skills():
    """Get all available skills for career planning"""
    try:
        # Define a comprehensive list of skills
        skills = [
            "Python", "JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS",
            "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin",
            "SQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch",
            "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform",
            "Git", "GitHub", "GitLab", "Linux", "Unix", "Windows", "macOS",
            "Machine Learning", "Deep Learning", "Data Analysis", "Data Science",
            "Statistics", "R", "MATLAB", "TensorFlow", "PyTorch", "Scikit-learn",
            "Pandas", "NumPy", "Matplotlib", "Seaborn", "Jupyter", "Tableau",
            "Power BI", "Excel", "Google Analytics", "Adobe Analytics",
            "UI/UX Design", "Figma", "Sketch", "Adobe XD", "InVision",
            "Product Management", "Agile", "Scrum", "Kanban", "Jira", "Confluence",
            "Project Management", "Leadership", "Communication", "Public Speaking",
            "Technical Writing", "Documentation", "API Design", "REST", "GraphQL",
            "Microservices", "Serverless", "CI/CD", "Jenkins", "GitHub Actions",
            "CircleCI", "Travis CI", "Testing", "Unit Testing", "Integration Testing",
            "E2E Testing", "Jest", "Cypress", "Selenium", "Performance Testing",
            "Security", "Cybersecurity", "Penetration Testing", "OWASP",
            "DevOps", "Site Reliability Engineering", "Monitoring", "Logging",
            "Prometheus", "Grafana", "ELK Stack", "Splunk", "New Relic",
            "Mobile Development", "iOS", "Android", "React Native", "Flutter",
            "Xamarin", "Ionic", "Cordova", "Web Development", "Frontend",
            "Backend", "Full Stack", "Progressive Web Apps", "WebAssembly",
            "Blockchain", "Smart Contracts", "Solidity", "Web3", "Ethereum",
            "Bitcoin", "Cryptocurrency", "NFTs", "DeFi", "Game Development",
            "Unity", "Unreal Engine", "Cocos2d", "Godot", "AR/VR",
            "Augmented Reality", "Virtual Reality", "Computer Vision",
            "Natural Language Processing", "NLP", "Chatbots", "Voice Recognition",
            "Internet of Things", "IoT", "Embedded Systems", "Raspberry Pi",
            "Arduino", "Robotics", "Automation", "RPA", "Business Intelligence",
            "Data Engineering", "ETL", "Data Warehousing", "Big Data", "Hadoop",
            "Spark", "Kafka", "Airflow", "dbt", "Snowflake", "Redshift",
            "Sales", "Marketing", "Digital Marketing", "SEO", "SEM", "Google Ads",
            "Facebook Ads", "Content Marketing", "Social Media Marketing",
            "Email Marketing", "Marketing Automation", "HubSpot", "Salesforce",
            "Customer Relationship Management", "CRM", "Enterprise Resource Planning",
            "ERP", "Supply Chain Management", "Logistics", "Finance", "Accounting",
            "Human Resources", "HR", "Recruitment", "Talent Management",
            "Learning Management System", "LMS", "E-learning", "Instructional Design",
            "Healthcare", "Telemedicine", "Health Informatics", "Bioinformatics",
            "Legal Tech", "RegTech", "FinTech", "InsurTech", "EdTech",
            "Real Estate", "PropTech", "Travel", "Tourism", "Hospitality",
            "Retail", "E-commerce", "Marketplace", "B2B", "B2C", "SaaS",
            "Platform as a Service", "PaaS", "Infrastructure as a Service", "IaaS",
            "Software as a Service", "SaaS", "API Management", "API Gateway",
            "Service Mesh", "Istio", "Linkerd", "Kong", "Nginx", "Apache",
            "Load Balancing", "CDN", "Content Delivery Network", "Edge Computing",
            "Serverless Computing", "Function as a Service", "FaaS", "Lambda",
            "Event-Driven Architecture", "Message Queues", "RabbitMQ", "Apache Kafka",
            "Redis Pub/Sub", "WebSockets", "Real-time Communication", "WebRTC",
            "Video Streaming", "Audio Processing", "Image Processing", "Computer Graphics",
            "3D Modeling", "Animation", "Video Editing", "Audio Editing",
            "Content Creation", "Copywriting", "Technical Writing", "Creative Writing",
            "Translation", "Localization", "Internationalization", "i18n",
            "Accessibility", "WCAG", "Usability", "User Experience", "UX Research",
            "User Interface", "UI Design", "Design Systems", "Component Libraries",
            "Design Tokens", "Branding", "Visual Design", "Typography", "Color Theory",
            "Information Architecture", "Wireframing", "Prototyping", "User Testing",
            "A/B Testing", "Conversion Rate Optimization", "CRO", "Growth Hacking",
            "Viral Marketing", "Influencer Marketing", "Affiliate Marketing",
            "Referral Marketing", "Word of Mouth", "Brand Awareness", "Customer Acquisition",
            "Customer Retention", "Customer Lifetime Value", "CLV", "Churn Rate",
            "Net Promoter Score", "NPS", "Customer Satisfaction", "CSAT",
            "Customer Support", "Help Desk", "Ticketing System", "Knowledge Base",
            "FAQ", "Documentation", "User Manuals", "Training", "Onboarding",
            "Customer Success", "Account Management", "Sales Operations", "Revenue Operations",
            "Business Development", "Partnerships", "Strategic Alliances", "Mergers & Acquisitions",
            "Venture Capital", "Private Equity", "Angel Investing", "Crowdfunding",
            "Initial Public Offering", "IPO", "Secondary Market", "Stock Market",
            "Trading", "Investment Banking", "Commercial Banking", "Retail Banking",
            "Digital Banking", "Mobile Banking", "Online Banking", "Payment Processing",
            "Payment Gateways", "Stripe", "PayPal", "Square", "Venmo", "Apple Pay",
            "Google Pay", "Samsung Pay", "Cryptocurrency Payments", "Bitcoin Payments",
            "Ethereum Payments", "Smart Contracts", "DeFi", "Decentralized Finance",
            "Yield Farming", "Liquidity Mining", "Staking", "Governance Tokens",
            "DAO", "Decentralized Autonomous Organization", "Web3", "Metaverse",
            "Virtual Worlds", "Digital Assets", "NFTs", "Non-Fungible Tokens",
            "Gaming", "Esports", "Streaming", "Twitch", "YouTube", "TikTok",
            "Social Media", "Facebook", "Instagram", "Twitter", "LinkedIn",
            "Snapchat", "Pinterest", "Reddit", "Discord", "Slack", "Microsoft Teams",
            "Zoom", "Google Meet", "Webex", "Skype", "Telegram", "WhatsApp",
            "Signal", "Privacy", "Security", "Encryption", "End-to-End Encryption",
            "Zero-Knowledge Proofs", "Homomorphic Encryption", "Differential Privacy",
            "Federated Learning", "Edge AI", "TinyML", "MLOps", "DataOps", "DevSecOps",
            "GitOps", "Infrastructure as Code", "IaC", "Terraform", "CloudFormation",
            "Ansible", "Chef", "Puppet", "Salt", "Configuration Management",
            "Container Orchestration", "Service Discovery", "Load Balancing", "Auto Scaling",
            "High Availability", "Fault Tolerance", "Disaster Recovery", "Backup & Recovery",
            "Data Backup", "Cloud Backup", "On-Premises", "Hybrid Cloud", "Multi-Cloud",
            "Edge Computing", "Fog Computing", "Quantum Computing", "Quantum Cryptography",
            "Quantum Machine Learning", "Quantum Algorithms", "Quantum Error Correction",
            "Quantum Supremacy", "Quantum Internet", "Quantum Sensors", "Quantum Imaging",
            "Quantum Communication", "Quantum Key Distribution", "QKD", "Post-Quantum Cryptography",
            "Lattice-Based Cryptography", "Code-Based Cryptography", "Multivariate Cryptography",
            "Hash-Based Cryptography", "Isogeny-Based Cryptography", "Supersingular Isogeny",
            "Elliptic Curve Cryptography", "ECC", "RSA", "AES", "DES", "Triple DES",
            "Blowfish", "Twofish", "ChaCha20", "Poly1305", "ChaCha20-Poly1305",
            "AES-GCM", "AES-CCM", "AES-OCB", "AES-SIV", "AES-GCM-SIV", "AES-GCM-SIV-256",
            "AES-GCM-SIV-512", "AES-GCM-SIV-1024", "AES-GCM-SIV-2048", "AES-GCM-SIV-4096"
        ]
        return {"skills": skills}
    except Exception as e:
        logger.error(f"Failed to get skills: {e}")
        raise HTTPException(500, "Failed to get skills")

@app.get("/api/explanation-levels")
async def get_explanation_levels():
    """Get list of available explanation levels."""
    levels = [
        {"value": ExplanationLevel.FIVE_YEAR_OLD.value, "label": "5 Year Old"},
        {"value": ExplanationLevel.INTERN.value, "label": "Intern"},
        {"value": ExplanationLevel.SENIOR.value, "label": "Senior"}
    ]
    return {"explanation_levels": levels}

# Dynamic Roadmap Generation Endpoints

@app.post("/api/career/roadmap/generate", response_model=RoadmapResponse)
async def generate_dynamic_roadmap(request: RoadmapRequest):
    """Generate dynamic career roadmap with micro-lesson integration"""
    try:
        # Use unified advisor for roadmap generation
        plan = await unified_advisor.generate_comprehensive_career_plan(
            user_profile={"experience_level": request.user_experience},
            target_role=request.target_role,
            user_skills=request.user_skills
        )
        
        return RoadmapResponse(
            target_role=request.target_role,
            roadmap=plan["roadmap"],
            user_experience=request.user_experience
        )
        
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(500, "Failed to generate career roadmap.")

@app.get("/api/lessons/micro")
async def get_micro_lessons(category: Optional[str] = None):
    """Get available micro-lessons"""
    try:
        lessons = unified_advisor.get_micro_lessons(category)
        return {"lessons": lessons}
    except Exception as e:
        logger.error(f"Failed to get micro-lessons: {e}")
        raise HTTPException(500, "Failed to get micro-lessons.")

@app.post("/api/lessons/search", response_model=LessonSearchResponse)
async def search_micro_lessons(request: LessonSearchRequest):
    """Search for micro-lessons by query"""
    try:
        results = unified_advisor.search_lessons(request.query)
        return LessonSearchResponse(results=results)
    except Exception as e:
        logger.error(f"Lesson search failed: {e}")
        raise HTTPException(500, "Failed to search micro-lessons.")

@app.get("/api/career/roadmap/cache/clear")
async def clear_roadmap_cache():
    """Clear roadmap cache (admin endpoint)"""
    try:
        unified_advisor.roadmap_cache.clear()
        unified_advisor._save_cache(unified_advisor.roadmap_cache, "roadmap_cache.json")
        return {"message": "Roadmap cache cleared successfully"}
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(500, "Failed to clear roadmap cache.")

# Advanced Career Coach Endpoints
@app.post("/api/career/guidance", response_model=CareerGuidanceResponse)
async def get_career_guidance(request: CareerGuidanceRequest):
    """Get personalized career guidance"""
    try:
        result = await career_coach.get_personalized_guidance(
            request.user_id, 
            request.user_profile, 
            request.query
        )
        return CareerGuidanceResponse(**result)
    except Exception as e:
        logger.error(f"Career guidance failed: {e}")
        raise HTTPException(500, "Failed to generate career guidance")

@app.post("/api/career/interview/start", response_model=InterviewSimulationResponse)
async def start_interview_simulation(request: InterviewSimulationRequest):
    """Start an interview simulation session"""
    try:
        result = await career_coach.start_interview_simulation(
            request.user_id,
            request.target_role,
            request.difficulty
        )
        return InterviewSimulationResponse(**result)
    except Exception as e:
        logger.error(f"Interview simulation start failed: {e}")
        raise HTTPException(500, "Failed to start interview simulation")

@app.post("/api/career/interview/answer", response_model=InterviewAnswerResponse)
async def submit_interview_answer(request: InterviewAnswerRequest):
    """Submit an answer during interview simulation"""
    try:
        result = await career_coach.submit_interview_answer(
            request.session_id,
            request.answer
        )
        return InterviewAnswerResponse(**result)
    except Exception as e:
        logger.error(f"Interview answer submission failed: {e}")
        raise HTTPException(500, "Failed to process interview answer")

@app.post("/api/career/advice", response_model=CareerAdviceResponse)
async def get_career_advice(request: CareerAdviceRequest):
    """Get career advice on specific topics"""
    try:
        result = await career_coach.get_career_advice(
            request.topic,
            request.user_context
        )
        return CareerAdviceResponse(**result)
    except Exception as e:
        logger.error(f"Career advice failed: {e}")
        raise HTTPException(500, "Failed to generate career advice")

@app.get("/api/career/interview/roles")
async def get_available_interview_roles():
    """Get available roles for interview simulation"""
    try:
        roles = career_coach.get_available_interview_roles()
        return {"roles": roles}
    except Exception as e:
        logger.error(f"Failed to get interview roles: {e}")
        raise HTTPException(500, "Failed to get available roles")

@app.get("/api/career/advice/topics")
async def get_career_advice_topics():
    """Get available career advice topics"""
    try:
        topics = career_coach.get_career_advice_topics()
        return {"topics": topics}
    except Exception as e:
        logger.error(f"Failed to get advice topics: {e}")
        raise HTTPException(500, "Failed to get advice topics")

@app.get("/api/career/sessions/{user_id}")
async def get_user_career_sessions(user_id: str):
    """Get all career sessions for a user"""
    try:
        sessions = career_coach.get_user_sessions(user_id)
        return sessions
    except Exception as e:
        logger.error(f"Failed to get user sessions: {e}")
        raise HTTPException(500, "Failed to get user sessions")

# AI Recommendation Engine Endpoints
@app.post("/api/recommendations/personalized", response_model=PersonalizedRecommendationsResponse)
async def generate_personalized_recommendations(request: UserProfileRequest):
    """Generate comprehensive personalized recommendations"""
    try:
        result = await recommendation_engine.generate_personalized_recommendations(
            request.user_id,
            request.user_profile
        )
        return PersonalizedRecommendationsResponse(**result)
    except Exception as e:
        logger.error(f"Personalized recommendations failed: {e}")
        raise HTTPException(500, "Failed to generate personalized recommendations")

@app.get("/api/recommendations/market-trends", response_model=MarketTrendsResponse)
async def get_market_trends():
    """Get current market trends and insights"""
    try:
        trends = recommendation_engine.get_market_trends()
        return MarketTrendsResponse(trends=trends)
    except Exception as e:
        logger.error(f"Failed to get market trends: {e}")
        raise HTTPException(500, "Failed to get market trends")

@app.get("/api/recommendations/learning-paths", response_model=LearningPathsResponse)
async def get_learning_paths():
    """Get available learning paths"""
    try:
        paths = recommendation_engine.get_learning_paths()
        return LearningPathsResponse(paths=paths)
    except Exception as e:
        logger.error(f"Failed to get learning paths: {e}")
        raise HTTPException(500, "Failed to get learning paths")

@app.get("/api/recommendations/user/{user_id}")
async def get_user_recommendations(user_id: str):
    """Get stored recommendations for a user"""
    try:
        recommendations = recommendation_engine.get_user_recommendations(user_id)
        if recommendations:
            return recommendations
        else:
            raise HTTPException(404, "No recommendations found for user")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user recommendations: {e}")
        raise HTTPException(500, "Failed to get user recommendations")

# Enhanced Career Roadmap Endpoints
@app.post("/api/career/roadmap/visual", response_model=VisualRoadmapResponse)
async def generate_visual_roadmap(request: VisualRoadmapRequest):
    """Generate visual and interactive career roadmap"""
    try:
        # Generate roadmap using existing roadmap generator
        roadmap = await roadmap_generator.generate_roadmap(
            request.target_role,
            request.user_skills,
            request.user_experience
        )
        
        # Add visual elements
        visual_data = {
            "nodes": [
                {
                    "id": "foundational",
                    "title": roadmap["foundational"]["title"],
                    "level": "foundational",
                    "skills_required": roadmap["foundational"]["skills"],
                    "estimated_duration": roadmap["foundational"]["duration"],
                    "salary_range": roadmap["foundational"]["salary_range"],
                    "courses": roadmap["foundational"]["recommended_lessons"],
                    "projects": []
                },
                {
                    "id": "intermediate",
                    "title": roadmap["intermediate"]["title"],
                    "level": "intermediate",
                    "skills_required": roadmap["intermediate"]["skills"],
                    "estimated_duration": roadmap["intermediate"]["duration"],
                    "salary_range": roadmap["intermediate"]["salary_range"],
                    "courses": roadmap["intermediate"]["recommended_lessons"],
                    "projects": []
                },
                {
                    "id": "advanced",
                    "title": roadmap["advanced"]["title"],
                    "level": "advanced",
                    "skills_required": roadmap["advanced"]["skills"],
                    "estimated_duration": roadmap["advanced"]["duration"],
                    "salary_range": roadmap["advanced"]["salary_range"],
                    "courses": roadmap["advanced"]["recommended_lessons"],
                    "projects": []
                }
            ],
            "edges": [
                {
                    "from_node": "foundational",
                    "to_node": "intermediate",
                    "transition_skills": roadmap["foundational"]["skills"],
                    "difficulty": "moderate"
                },
                {
                    "from_node": "intermediate",
                    "to_node": "advanced",
                    "transition_skills": roadmap["intermediate"]["skills"],
                    "difficulty": "high"
                }
            ]
        }
        
        interactive_elements = [
            {
                "type": "skill_check",
                "node_id": "foundational",
                "description": "Check your foundational skills"
            },
            {
                "type": "course_recommendation",
                "node_id": "intermediate",
                "description": "Get course recommendations"
            },
            {
                "type": "project_suggestion",
                "node_id": "advanced",
                "description": "Build portfolio projects"
            }
        ]
        
        return VisualRoadmapResponse(
            target_role=request.target_role,
            roadmap=roadmap,
            visual_data=visual_data if request.include_visual else None,
            interactive_elements=interactive_elements
        )
        
    except Exception as e:
        logger.error(f"Visual roadmap generation failed: {e}")
        raise HTTPException(500, "Failed to generate visual roadmap")

# Advanced Analytics Endpoints
@app.get("/api/analytics/user/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_analytics(user_id: str, time_period: str = "30d"):
    """Get comprehensive user analytics"""
    try:
        # Mock analytics data - in production, this would come from database
        analytics = {
            "user_id": user_id,
            "learning_progress": {
                "lessons_completed": 15,
                "total_lessons": 25,
                "completion_rate": 60.0,
                "streak_days": 7,
                "time_spent": "45 hours"
            },
            "skill_growth": {
                "python": {"current": 0.8, "target": 1.0, "progress": 80.0},
                "javascript": {"current": 0.6, "target": 0.9, "progress": 67.0},
                "react": {"current": 0.4, "target": 0.8, "progress": 50.0}
            },
            "career_advancement": {
                "current_role": "Junior Developer",
                "target_role": "Senior Developer",
                "advancement_score": 0.65,
                "estimated_time": "18 months"
            },
            "market_alignment": {
                "hot_skills_alignment": 0.75,
                "salary_progression": 0.60,
                "industry_demand": "High"
            },
            "recommendations": [
                {"type": "skill", "priority": "high", "skill": "System Design"},
                {"type": "project", "priority": "medium", "project": "Build a microservice"},
                {"type": "certification", "priority": "low", "cert": "AWS Developer"}
            ]
        }
        
        return UserAnalyticsResponse(**analytics)
        
    except Exception as e:
        logger.error(f"User analytics failed: {e}")
        raise HTTPException(500, "Failed to generate user analytics")

# Enhanced Career Pathfinder Endpoints (Image-based)
@app.post("/api/career/planning", response_model=CareerPlanningResponse)
async def generate_career_planning(request: CareerPlanningRequest):
    """Generate career recommendations based on interests and skills (like the image)"""
    try:
        # Use unified advisor for comprehensive planning
        plan = await unified_advisor.generate_comprehensive_career_plan(
            user_profile={},
            user_skills=request.skills,
            user_interests=request.interests
        )
        
        # Extract career recommendations from the plan
        result = {
            "recommended_careers": [plan["target_role"]],
            "confidence_score": plan["confidence_score"],
            "skill_gaps": plan["skill_gaps"],
            "learning_recommendations": plan["learning_plan"]
        }
        return CareerPlanningResponse(**result)
    except Exception as e:
        logger.error(f"Career planning failed: {e}")
        raise HTTPException(500, "Failed to generate career planning")

@app.post("/api/career/roadmap/enhanced", response_model=CareerRoadmapResponse)
async def generate_enhanced_career_roadmap(request: CareerRoadmapRequest):
    """Generate detailed roadmap for a specific career"""
    try:
        plan = await unified_advisor.generate_comprehensive_career_plan(
            user_profile={},
            target_role=request.career_title,
            user_skills=request.user_skills
        )
        
        result = {
            "career_title": request.career_title,
            "roadmap": plan["roadmap"],
            "skill_gaps": plan["skill_gaps"],
            "learning_plan": plan["learning_plan"],
            "timeline": plan["timeline"]
        }
        return CareerRoadmapResponse(**result)
    except Exception as e:
        logger.error(f"Enhanced career roadmap failed: {e}")
        raise HTTPException(500, "Failed to generate career roadmap")

@app.get("/api/career/planning/options", response_model=PredefinedOptionsResponse)
async def get_career_planning_options():
    """Get predefined interests and skills options"""
    try:
        # Define predefined options for the frontend
        interests = [
            "Technology", "Design", "Marketing", "Data Science", 
            "Product Management", "Cybersecurity", "DevOps", "Mobile Development"
        ]
        skills = [
            "Python", "JavaScript", "React", "Node.js", "SQL", "AWS",
            "UI/UX Design", "SEO", "Content Marketing", "Data Analysis",
            "Machine Learning", "Docker", "Kubernetes", "Git"
        ]
        return PredefinedOptionsResponse(interests=interests, skills=skills)
    except Exception as e:
        logger.error(f"Failed to get planning options: {e}")
        raise HTTPException(500, "Failed to get planning options")

@app.get("/api/career/available")
async def get_available_careers():
    """Get all available careers"""
    try:
        careers = unified_advisor.career_data['title'].tolist()
        return {"careers": careers}
    except Exception as e:
        logger.error(f"Failed to get available careers: {e}")
        raise HTTPException(500, "Failed to get available careers")

@app.post("/api/career/comprehensive-plan", response_model=ComprehensiveCareerPlanResponse)
async def generate_comprehensive_career_plan(request: ComprehensiveCareerPlanRequest):
    """
    Generate a comprehensive career plan that includes:
    1. Career recommendations
    2. Personalized roadmap
    3. Skill gap analysis
    4. Learning recommendations
    5. Career coaching advice
    6. Market insights
    7. Timeline and milestones
    """
    try:
        plan = await unified_career_system.generate_unified_roadmap(
            user_profile=request.user_profile,
            target_role=request.target_role,
            user_skills=request.user_skills or [],
            user_interests=request.user_interests or []
        )
        return ComprehensiveCareerPlanResponse(**plan)
    except Exception as e:
        logger.error(f"Error generating comprehensive career plan: {e}")
        raise HTTPException(500, "Failed to generate comprehensive career plan")

# Smart Career Pathfinder Endpoints
@app.get("/api/career/smart/initial-suggestions")
async def get_initial_suggestions(user_profile: Optional[Dict] = None):
    """Get initial suggestions based on user profile or default options"""
    try:
        suggestions = await smart_pathfinder.get_initial_suggestions(user_profile)
        return suggestions
    except Exception as e:
        logger.error(f"Error getting initial suggestions: {e}")
        raise HTTPException(500, "Failed to get initial suggestions")

@app.post("/api/career/smart/suggest-skills", response_model=SkillSuggestionResponse)
async def suggest_next_skills(request: SkillSuggestionRequest):
    """Suggest next skills based on current selections"""
    try:
        suggestions = await smart_pathfinder.suggest_next_skills(
            selected_interests=request.selected_interests,
            selected_skills=request.selected_skills,
            user_profile=request.user_profile
        )
        return SkillSuggestionResponse(**suggestions)
    except Exception as e:
        logger.error(f"Error suggesting skills: {e}")
        raise HTTPException(500, "Failed to suggest skills")

@app.post("/api/career/smart/comprehensive-plan", response_model=SmartCareerResponse)
async def generate_smart_career_plan(request: SmartCareerRequest):
    """
    Generate comprehensive career plan with smart features:
    1. Adaptive skill suggestions
    2. Target role recommendation (if not provided)
    3. Detailed career roadmap
    4. Interview preparation
    5. Learning recommendations
    """
    try:
        plan = await smart_pathfinder.generate_comprehensive_career_plan(
            selected_interests=request.selected_interests,
            selected_skills=request.selected_skills,
            user_profile=request.user_profile,
            target_role=request.target_role
        )
        return SmartCareerResponse(**plan)
    except Exception as e:
        logger.error(f"Error generating smart career plan: {e}")
        raise HTTPException(500, "Failed to generate smart career plan")

@app.post("/api/career/smart/interview-prep", response_model=InterviewPrepResponse)
async def generate_interview_preparation(request: InterviewPrepRequest):
    """Generate interview preparation guidance for target role"""
    try:
        prep = await smart_pathfinder._generate_interview_preparation(
            target_role=request.target_role,
            user_profile=request.user_profile
        )
        return InterviewPrepResponse(**prep)
    except Exception as e:
        logger.error(f"Error generating interview preparation: {e}")
        raise HTTPException(500, "Failed to generate interview preparation")

# Smart Career Pathfinder - Career Discovery
@app.post("/api/career/smart/discover", response_model=CareerDiscoveryResponse)
async def discover_careers(request: CareerDiscoveryRequest):
    """Discover career paths based on selected interests and skills"""
    try:
        discovery = await smart_pathfinder.discover_careers(
            selected_interests=request.selected_interests,
            selected_skills=request.selected_skills,
            user_profile=request.user_profile
        )
        return CareerDiscoveryResponse(**discovery)
    except Exception as e:
        logger.error(f"Error discovering careers: {e}")
        raise HTTPException(500, "Failed to discover careers")

# Unified Career System Endpoints
@app.post("/api/career/roadmap/unified", response_model=UnifiedRoadmapResponse)
async def generate_unified_roadmap(request: UnifiedRoadmapRequest):
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
        roadmap = await unified_career_system.generate_unified_roadmap(
            user_profile=request.user_profile,
            target_role=request.target_role,
            user_skills=request.user_skills,
            user_interests=request.user_interests
        )
        return UnifiedRoadmapResponse(**roadmap)
    except Exception as e:
        logger.error(f"Error generating unified roadmap: {e}")
        raise HTTPException(500, "Failed to generate unified roadmap")

@app.post("/api/career/roadmap/interview-prep", response_model=InterviewPrepResponse)
async def generate_roadmap_interview_prep(request: InterviewPrepRequest):
    """Generate interview preparation for roadmap target role"""
    try:
        prep = await unified_career_system._generate_interview_preparation(
            target_role=request.target_role,
            user_profile=request.user_profile
        )
        return InterviewPrepResponse(**prep)
    except Exception as e:
        logger.error(f"Error generating roadmap interview prep: {e}")
        raise HTTPException(500, "Failed to generate interview preparation")
