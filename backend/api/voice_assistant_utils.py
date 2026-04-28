import os
import re

try:
    import google.generativeai as genai
except ImportError:
    pass

def normalize_text(text):
    return text.lower().strip()

def is_greeting(text):
    greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'greetings']
    words = text.split()
    if len(words) <= 3:
        for g in greetings:
            if g in words:
                return True
    return False

def is_thanks(text):
    thanks = ['thanks', 'thank you', 'tysm', 'thanks a lot', 'appreciate it']
    if len(text.split()) <= 4:
        for t in thanks:
            if t in text:
                return True
    return False

def is_clearly_off_topic(text):
    # Only reject if it has absolutely no educational intent and has strong off-topic keywords
    off_topic = [
        'movie', 'joke', 'politics', 'sports', 'cricket', 'football', 
        'music', 'song', 'president', 'actor', 'buy', 'shop', 'girlfriend', 
        'boyfriend', 'romantic', 'gossip', 'entertainment', 'dating', 'weather'
    ]
    educational_indicators = [
        'what is', 'explain', 'define', 'how does', 'how to solve', 'tell me about',
        'math', 'science', 'history', 'computer', 'biology', 'concept', 'meaning'
    ]
    
    # If it has educational indicators, we should NOT consider it off-topic early. Let Gemini decide.
    for edu in educational_indicators:
        if edu in text:
            return False
            
    words = set(re.findall(r'\w+', text))
    for o in off_topic:
        if o in words:
            return True
            
    return False

SYSTEM_INSTRUCTION = """
You are a study-only academic assistant for students. Answer all valid academic questions clearly and directly, including basic definition questions like 'What is multiplication?'. Reject only clearly non-academic topics.

Rules:
1. When asked about definitions, concepts, or academic topics (e.g., multiplication, photosynthesis, DBMS, algebra), provide a clear, concise, and helpful explanation suitable for voice output (2-4 sentences).
2. Do not reject valid educational questions just because they are short.
3. If the question is genuinely off-topic (movies, celebrities, random chat), politely reply: "I’m here only for study-related help such as subjects, chapters, concepts, exams, and academic doubts."
4. Do not use Markdown formatting (*, **, #). Speak naturally.
"""

def generate_voice_study_response(user_text):
    # 1. Normalize
    normalized = normalize_text(user_text)
    
    # 2. Fast Path: Greetings
    if is_greeting(normalized):
        return {
            "type": "greeting",
            "subject": None,
            "difficulty": None,
            "response": "Hello! I’m your study voice assistant. Ask me any academic question."
        }
        
    # 3. Fast Path: Thanks
    if is_thanks(normalized):
        return {
            "type": "thanks",
            "subject": None,
            "difficulty": None,
            "response": "You’re welcome. Ask me anytime if you have another study question."
        }
        
    # 4. Off-Topic Rejection (if clearly unrelated)
    if is_clearly_off_topic(normalized):
        return {
            "type": "off_topic",
            "subject": None,
            "difficulty": None,
            "response": "I’m here only for study-related help such as subjects, chapters, concepts, exams, and academic doubts."
        }

    # 5. Send to Gemini for Academic Resolution
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "type": "error",
            "response": "The Gemini API key is missing on the backend. Please configure GEMINI_API_KEY securely."
        }
        
    try:
        genai.configure(api_key=api_key)
        
        # Robust Model Selection based on discovered available models in this environment
        preferred_models = [
            'gemini-3.1-flash-l', 'gemini-2.5-flash', 'gemini-2.0-flash', 
            'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'
        ]
        model = None
        
        try:
            # Get list of actually available model names
            available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
            print("Available models:", available_models)
            
            for pref in preferred_models:
                # Direct match or partial match
                match = next((m for m in available_models if pref in m), None)
                if match:
                    model = genai.GenerativeModel(match)
                    print(f"Selected model: {match}")
                    break
            
            if not model and available_models:
                model = genai.GenerativeModel(available_models[0])
                print(f"Fallback selected model: {available_models[0]}")
        except Exception as list_err:
            print("Model discovery failed, using static fallback gemini-1.5-flash:", str(list_err))
            model = genai.GenerativeModel('gemini-1.5-flash')

        config = genai.GenerationConfig(
            temperature=0.3,
        )
        
        full_prompt = SYSTEM_INSTRUCTION + "\n\nUser Question: " + (user_text or "Hello")
        
        try:
            chat_response = model.generate_content(full_prompt, generation_config=config)
            
            if not chat_response.candidates or not chat_response.candidates[0].content.parts:
                bot_reply = "I'm sorry, I cannot answer that question as it might be outside my safe academic boundaries."
            else:
                bot_reply = chat_response.text.strip()
        except Exception as api_err:
            error_msg = str(api_err)
            if "429" in error_msg:
                bot_reply = "The academic AI brain is currently busy processing many requests. Please try again in 30 seconds."
            elif "404" in error_msg:
                bot_reply = "The study model is currently being updated. Please try again in a moment."
            else:
                raise api_err # Re-raise for the outer block to catch and log general error
        
        # Clean up any residual markdown
        bot_reply = bot_reply.replace('**', '').replace('*', '').replace('_', '').replace('`', '')
        
        return {
            "type": "study_response",
            "subject": "Academic Topic", 
            "difficulty": "Dynamic",
            "response": bot_reply
        }
    except Exception as e:
        print("Final Gemini API Error Logic:", str(e))
        return {
            "type": "error",
            "response": "I couldn’t process that properly. Please try asking your academic question again."
        }
