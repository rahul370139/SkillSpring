import os, supabase, orjson
from loguru import logger
from datetime import datetime
from typing import List, Dict, Optional
from schemas import Framework, ExplanationLevel

# Initialize Supabase client only if environment variables are available
SUPA = None
try:
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if supabase_url and supabase_key:
        SUPA = supabase.create_client(supabase_url, supabase_key)
    else:
        logger.warning("Supabase credentials not found. Running in test mode.")
except Exception as e:
    logger.warning(f"Failed to initialize Supabase client: {e}. Running in test mode.")

def insert_lesson(owner_id: str, title: str, summary: str, framework: Framework = Framework.GENERIC, explanation_level: ExplanationLevel = ExplanationLevel.INTERN) -> int:
    if not SUPA:
        logger.warning("Supabase not available. Returning dummy lesson_id.")
        return 123  # Dummy ID for testing
    try:
        res = SUPA.table("lessons").insert({
            "owner": owner_id, 
            "title": title, 
            "summary": summary,
            "framework": framework.value,
            "explanation_level": explanation_level.value,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        lesson_id = res.data[0]["id"]
        logger.info(f"Inserted lesson {lesson_id}")
        return lesson_id
    except Exception as e:
        logger.error(f"Supabase insert_lesson failed: {e}")
        raise RuntimeError("Failed to insert lesson into Supabase.")

def insert_cards(lesson_id: int, cards: list[dict]):
    if not SUPA:
        logger.warning("Supabase not available. Skipping card insertion.")
        return
    try:
        SUPA.table("lesson_metadata").insert(cards).execute()
    except Exception as e:
        logger.error(f"Supabase insert_cards failed: {e}")
        raise RuntimeError("Failed to insert cards into Supabase.")

def insert_concept_map(lesson_id: int, concept_map: Dict):
    """Insert concept map data for a lesson."""
    if not SUPA:
        logger.warning("Supabase not available. Skipping concept map insertion.")
        return
    try:
        SUPA.table("concept_maps").insert({
            "lesson_id": lesson_id,
            "nodes": concept_map.get("nodes", []),
            "edges": concept_map.get("edges", []),
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        logger.info(f"Inserted concept map for lesson {lesson_id}")
    except Exception as e:
        logger.error(f"Supabase insert_concept_map failed: {e}")
        raise RuntimeError("Failed to insert concept map into Supabase.")

def mark_lesson_completed(user_id: str, lesson_id: int, progress_percentage: float = 100.0):
    """Mark a lesson as completed for a user."""
    if not SUPA:
        logger.warning("Supabase not available. Skipping completion tracking.")
        return
    try:
        SUPA.table("lesson_completions").upsert({
            "user_id": user_id,
            "lesson_id": lesson_id,
            "completed_at": datetime.utcnow().isoformat(),
            "progress_percentage": progress_percentage
        }).execute()
        logger.info(f"Marked lesson {lesson_id} as completed for user {user_id}")
    except Exception as e:
        logger.error(f"Supabase mark_lesson_completed failed: {e}")
        raise RuntimeError("Failed to mark lesson as completed.")

def get_user_completed_lessons(user_id: str) -> List[Dict]:
    """Get all completed lessons for a user."""
    if not SUPA:
        logger.warning("Supabase not available. Returning empty completion list.")
        return []
    try:
        res = SUPA.table("lesson_completions").select("*").eq("user_id", user_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Supabase get_user_completed_lessons failed: {e}")
        return []

def upsert_user_role(user_id: str, role: str, experience_level: str, interests: List[str]):
    """Create or update user role and preferences."""
    if not SUPA:
        logger.warning("Supabase not available. Skipping user role update.")
        return
    try:
        SUPA.table("user_roles").upsert({
            "user_id": user_id,
            "role": role,
            "experience_level": experience_level,
            "interests": interests,
            "updated_at": datetime.utcnow().isoformat()
        }).execute()
        logger.info(f"Updated user role for {user_id}")
    except Exception as e:
        logger.error(f"Supabase upsert_user_role failed: {e}")
        raise RuntimeError("Failed to update user role.")

def get_user_role(user_id: str) -> Optional[Dict]:
    """Get user role and preferences."""
    if not SUPA:
        logger.warning("Supabase not available. Returning None for user role.")
        return None
    try:
        res = SUPA.table("user_roles").select("*").eq("user_id", user_id).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        logger.error(f"Supabase get_user_role failed: {e}")
        return None

def get_lessons_by_framework(framework: Framework, limit: int = 10) -> List[Dict]:
    """Get lessons filtered by framework."""
    if not SUPA:
        logger.warning("Supabase not available. Returning empty lesson list.")
        return []
    try:
        res = SUPA.table("lessons").select("*").eq("framework", framework.value).limit(limit).execute()
        return res.data
    except Exception as e:
        logger.error(f"Supabase get_lessons_by_framework failed: {e}")
        return []

def get_user_progress_stats(user_id: str) -> Dict:
    """Get user's learning progress statistics."""
    if not SUPA:
        logger.warning("Supabase not available. Returning dummy progress stats.")
        return {"total_lessons": 0, "completed_lessons": 0, "completion_rate": 0.0}
    try:
        # Get total lessons
        total_res = SUPA.table("lessons").select("id", count="exact").execute()
        total_lessons = total_res.count or 0
        
        # Get completed lessons
        completed_res = SUPA.table("lesson_completions").select("lesson_id").eq("user_id", user_id).execute()
        completed_lessons = len(completed_res.data)
        
        completion_rate = (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0.0
        
        return {
            "total_lessons": total_lessons,
            "completed_lessons": completed_lessons,
            "completion_rate": round(completion_rate, 2)
        }
    except Exception as e:
        logger.error(f"Supabase get_user_progress_stats failed: {e}")
        return {"total_lessons": 0, "completed_lessons": 0, "completion_rate": 0.0}
