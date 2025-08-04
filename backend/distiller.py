from typing import List, Dict, Optional
from pathlib import Path
import io, os, json, asyncio
import fitz  # PyMuPDF
from loguru import logger
from groq import Groq
from schemas import ExplanationLevel, Framework
import uuid
from datetime import datetime

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CHUNK_WORDS = 400
OVERLAP = 50

# In-memory conversation storage (replace with database in production)
conversation_store = {}

def pdf_to_text(path: Path) -> str:
    try:
        doc = fitz.open(str(path))
        text = "\n\n".join(page.get_text() for page in doc)
        return text
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise RuntimeError("Failed to extract text from PDF.")

def chunk_text(text: str) -> List[str]:
    words = text.split()
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        if len(cur) >= CHUNK_WORDS:
            chunks.append(" ".join(cur))
            cur = cur[-OVERLAP:]  # overlap
    if cur:
        chunks.append(" ".join(cur))
    return chunks

async def embed_chunks(chunks: List[str]) -> List[List[float]]:
    # Placeholder: Replace with actual embedding logic or Supabase vector store
    # For now, return dummy vectors
    return [[0.0]*384 for _ in chunks]

def get_explanation_prompt(level: ExplanationLevel) -> str:
    """Get the appropriate prompt based on explanation level."""
    prompts = {
        ExplanationLevel.FIVE_YEAR_OLD: "Explain this like you're talking to a 5-year-old. Use simple words, analogies, and avoid technical jargon.",
        ExplanationLevel.INTERN: "Explain this for someone who is learning and has basic knowledge. Use clear examples and step-by-step explanations.",
        ExplanationLevel.SENIOR: "Explain this for an experienced professional. You can use technical terms and assume advanced knowledge."
    }
    return prompts.get(level, prompts[ExplanationLevel.INTERN])

async def detect_framework(text: str) -> Framework:
    """Detect the primary framework/tool from the content."""
    try:
        prompt = f"""
Analyze this text and identify the primary framework, tool, or technology category.
Return only one of these exact values:
- fastapi
- docker
- python
- machine_learning
- ai
- langchain
- react
- nextjs
- typescript
- nodejs
- database
- cloud
- devops
- frontend
- backend
- generic

Text: {text[:1000]}
"""
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_completion_tokens=50,
            top_p=1,
            stream=False,
            stop=None,
        )
        result = completion.choices[0].message.content.strip().lower()
        return Framework(result) if result in [f.value for f in Framework] else Framework.GENERIC
    except Exception as e:
        logger.error(f"Framework detection failed: {e}")
        return Framework.GENERIC

async def map_reduce_summary(chunks: List[str], explanation_level: ExplanationLevel = ExplanationLevel.INTERN) -> str:
    explanation_prompt = get_explanation_prompt(explanation_level)
    
    async def summarize_chunk(chunk):
        try:
            completion = client.chat.completions.create(
                model="gemma2-9b-it",
                messages=[
                    {"role": "system", "content": f"Summarize the text into 3 concise bullets. {explanation_prompt}"},
                    {"role": "user", "content": chunk},
                ],
                temperature=1,
                max_tokens=256,
                top_p=1,
                stream=False,
                stop=None,
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM summarize_chunk failed: {e}")
            raise RuntimeError("LLM summarization failed.")
    
    try:
        mapped = await asyncio.gather(*[summarize_chunk(ch) for ch in chunks])
        reduce_prompt = (
            f"You are creating a training cheat-sheet. {explanation_prompt} "
            "Merge these bullet groups into **max 10 key bullets**:\n"
            + "\n".join(mapped)
        )
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": reduce_prompt}],
            temperature=1,
            max_tokens=512,
            top_p=1,
            stream=False,
            stop=None,
        )
        return completion.choices[0].message.content
    except Exception as e:
        logger.error(f"LLM map_reduce_summary failed: {e}")
        raise RuntimeError("LLM summary reduce failed.")

async def gen_flashcards_quiz(summary: str, explanation_level: ExplanationLevel = ExplanationLevel.INTERN) -> Dict[str, list]:
    explanation_prompt = get_explanation_prompt(explanation_level)
    prompt = (
        f"Given the following summary, create {explanation_prompt}:\n"
        "1. 5 flashcards as JSON list of { \"front\": str, \"back\": str }\n"
        "2. 5 multiple-choice questions as JSON list of {\n"
        "   \"question\": str, \"options\": [a,b,c,d], \"answer\": \"a\"\n"
        "}\n"
        "Return valid JSON with keys 'flashcards' and 'quiz'.\n"
        "Summary:\n"
        f"{summary}"
    )
    try:
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        data = json.loads(completion.choices[0].message.content)
        return data
    except Exception as e:
        logger.error(f"LLM flashcards/quiz failed: {e}")
        raise RuntimeError("LLM flashcards/quiz generation failed.")

async def generate_concept_map(summary: str) -> Dict:
    """Generate a concept map showing relationships between key concepts."""
    try:
        prompt = f"""
Create a concept map from this summary. Return as JSON with this structure:
{{
  "nodes": [
    {{"id": "concept1", "label": "Concept Name", "level": 1}},
    {{"id": "concept2", "label": "Related Concept", "level": 2}}
  ],
  "edges": [
    {{"from": "concept1", "to": "concept2", "label": "relationship"}}
  ]
}}

Summary: {summary}
"""
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=512,
            top_p=1,
            stream=False,
            stop=None,
        )
        data = json.loads(completion.choices[0].message.content)
        return data
    except Exception as e:
        logger.error(f"Concept map generation failed: {e}")
        return {"nodes": [], "edges": []}

async def get_role_based_recommendations(user_id: str, role: str, experience_level: str, interests: List[str]) -> List[Dict]:
    """Get personalized lesson recommendations based on user role and interests."""
    try:
        prompt = f"""
Given a user with:
- Role: {role}
- Experience: {experience_level}
- Interests: {', '.join(interests)}

Recommend 5 lesson topics that would be most valuable for this user.
Return as JSON list: [{{"title": "Lesson Title", "framework": "framework_name", "difficulty": "beginner/intermediate/advanced"}}]
"""
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=512,
            top_p=1,
            stream=False,
            stop=None,
        )
        data = json.loads(completion.choices[0].message.content)
        return data
    except Exception as e:
        logger.error(f"Role-based recommendations failed: {e}")
        return []

# Chatbot functions
def get_or_create_conversation(conversation_id: Optional[str], user_id: str) -> str:
    """Get existing conversation or create new one."""
    if conversation_id and conversation_id in conversation_store:
        return conversation_id
    
    new_conversation_id = str(uuid.uuid4())
    conversation_store[new_conversation_id] = {
        "user_id": user_id,
        "messages": [],
        "file_context": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    return new_conversation_id

def add_message_to_conversation(conversation_id: str, role: str, content: str):
    """Add a message to the conversation history."""
    if conversation_id not in conversation_store:
        return
    
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }
    conversation_store[conversation_id]["messages"].append(message)
    conversation_store[conversation_id]["updated_at"] = datetime.utcnow().isoformat()

async def process_chat_message(user_id: str, message: str, conversation_id: Optional[str], explanation_level: ExplanationLevel) -> Dict:
    """Process a chat message and generate a response."""
    try:
        conv_id = get_or_create_conversation(conversation_id, user_id)
        add_message_to_conversation(conv_id, "user", message)
        
        # Get conversation context
        conversation = conversation_store[conv_id]
        messages = conversation["messages"]
        file_context = conversation.get("file_context")
        
        # Build system prompt
        system_prompt = f"""You are TrainPI, an AI learning assistant. {get_explanation_prompt(explanation_level)}

Your role is to help users learn and understand concepts. Be helpful, encouraging, and educational.

If a file has been uploaded, you can reference its content to provide more specific answers."""
        
        # Build messages for LLM
        llm_messages = [{"role": "system", "content": system_prompt}]
        
        # Add file context if available
        if file_context:
            llm_messages.append({
                "role": "system", 
                "content": f"File context: {file_context}\n\nUse this information to provide more specific and relevant answers."
            })
        
        # Add conversation history (last 10 messages to avoid token limits)
        for msg in messages[-10:]:
            llm_messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Generate response
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=llm_messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        
        response = completion.choices[0].message.content
        add_message_to_conversation(conv_id, "assistant", response)
        
        return {
            "response": response,
            "conversation_id": conv_id,
            "message_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat message processing failed: {e}")
        raise RuntimeError("Failed to process chat message.")

async def process_file_for_chat(file_path: Path, user_id: str, conversation_id: Optional[str], explanation_level: ExplanationLevel) -> Dict:
    """Process uploaded file and add context to conversation."""
    try:
        # Extract text from file
        text = pdf_to_text(file_path)
        chunks = chunk_text(text)
        
        # Generate summary for context
        summary = await map_reduce_summary(chunks, explanation_level)
        
        # Get or create conversation
        conv_id = get_or_create_conversation(conversation_id, user_id)
        
        # Add file context to conversation
        conversation_store[conv_id]["file_context"] = summary
        conversation_store[conv_id]["updated_at"] = datetime.utcnow().isoformat()
        
        # Generate response about the uploaded file
        system_prompt = f"""You are TrainPI, an AI learning assistant. {get_explanation_prompt(explanation_level)}

A file has been uploaded and processed. Here's a summary of its content:

{summary}

Provide a helpful response about what you found in the file and how you can help the user learn from it."""
        
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "I've uploaded a file. What can you tell me about it and how can you help me learn from it?"}
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        
        response = completion.choices[0].message.content
        add_message_to_conversation(conv_id, "assistant", response)
        
        return {
            "response": response,
            "conversation_id": conv_id,
            "message_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
            "file_processed": True,
            "summary": summary
        }
        
    except Exception as e:
        logger.error(f"File processing for chat failed: {e}")
        raise RuntimeError("Failed to process file for chat.")

def get_conversation_history(conversation_id: str) -> Optional[Dict]:
    """Get conversation history."""
    if conversation_id not in conversation_store:
        return None
    
    conversation = conversation_store[conversation_id]
    return {
        "conversation_id": conversation_id,
        "user_id": conversation["user_id"],
        "messages": conversation["messages"],
        "created_at": conversation["created_at"],
        "updated_at": conversation["updated_at"],
        "has_file_context": conversation.get("file_context") is not None
    }

def get_user_conversations(user_id: str) -> List[Dict]:
    """Get all conversations for a user."""
    user_conversations = []
    for conv_id, conversation in conversation_store.items():
        if conversation["user_id"] == user_id:
            user_conversations.append({
                "conversation_id": conv_id,
                "created_at": conversation["created_at"],
                "updated_at": conversation["updated_at"],
                "message_count": len(conversation["messages"]),
                "has_file_context": conversation.get("file_context") is not None
            })
    return user_conversations
