"""
Gemini AI Study Coach — generates personalized study insights
based on concentration session data.
"""
import os
import json

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


def get_gemini_model():
    """Initialize Gemini model with API key from environment."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or not GEMINI_AVAILABLE:
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-2.0-flash")


def generate_study_insights(session_data: dict) -> str:
    """
    Generate personalized study recommendations from session data.
    Returns a string with AI-generated insights.
    """
    model = get_gemini_model()
    if not model:
        return _fallback_insights(session_data)

    prompt = f"""You are an AI study coach analyzing a student's concentration session.
Analyze this data and give 3-4 concise, actionable study tips.

Session Data:
- Duration: {session_data.get('duration', 0):.0f} seconds
- Average Concentration: {session_data.get('avg_concentration', 0):.1f}%
- Focus Rate: {session_data.get('focus_rate', 0):.1f}%
- Total Blinks: {session_data.get('blink_count', 0)}
- State Distribution: {json.dumps(session_data.get('state_distribution', {}))}

Rules:
- Be encouraging but honest
- Keep each tip to 1-2 sentences
- If focus is high (>70%), congratulate and suggest optimization
- If focus is low (<40%), suggest specific techniques (Pomodoro, breaks, environment changes)
- Reference their specific metrics (e.g. "Your blink rate suggests eye strain")
- Format as numbered list, no markdown"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return _fallback_insights(session_data)


def _fallback_insights(session_data: dict) -> str:
    """Provide rule-based insights when Gemini API is unavailable."""
    avg = session_data.get('avg_concentration', 0)
    focus_rate = session_data.get('focus_rate', 0)
    duration = session_data.get('duration', 0)
    blinks = session_data.get('blink_count', 0)

    tips = []

    if avg >= 70:
        tips.append("Great focus session! Your concentration was above average.")
    elif avg >= 40:
        tips.append("Decent session, but there's room for improvement.")
    else:
        tips.append("Your concentration was low this session. Try removing distractions.")

    if duration > 3600:
        tips.append("Long session detected. Take 10-minute breaks every 50 minutes to maintain peak focus.")
    elif duration > 1800:
        tips.append("Good session length. Try the Pomodoro technique (25 min work, 5 min break) for even better results.")

    if blinks > 0:
        blink_rate = blinks / (duration / 60) if duration > 0 else 0
        if blink_rate > 25:
            tips.append(f"High blink rate ({blink_rate:.0f}/min) suggests eye strain. Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.")
        elif blink_rate < 10:
            tips.append(f"Low blink rate ({blink_rate:.0f}/min). Remember to blink regularly to prevent dry eyes.")

    if focus_rate < 50:
        tips.append("Try studying in a quiet environment with your phone in another room to reduce distractions.")
    else:
        tips.append("Your focus patterns show good study habits. Keep it up!")

    return "\n".join(f"{i+1}. {t}" for i, t in enumerate(tips))
