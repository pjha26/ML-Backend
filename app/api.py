"""
ConcentraAI - FastAPI Web API
WebSocket endpoint for real-time concentration detection
REST endpoints for session analytics
"""

import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from app.ml_engine import ConcentrationDetector

# ==================== APP SETUP ====================

app = FastAPI(
    title="ConcentraAI",
    description="Student Concentration Detection API",
    version="2.0.0",
)

# CORS - allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Per-connection detector instances
detectors: dict[str, ConcentrationDetector] = {}


# ==================== REST ENDPOINTS ====================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ConcentraAI"}


@app.get("/api/session/{client_id}")
async def get_session(client_id: str):
    """Get session summary for a client."""
    detector = detectors.get(client_id)
    if not detector:
        return JSONResponse(
            status_code=404,
            content={"error": "No active session found for this client"}
        )
    return detector.get_session_summary()


@app.post("/api/session/{client_id}/reset")
async def reset_session(client_id: str):
    """Reset session data for a client."""
    detector = detectors.get(client_id)
    if detector:
        detector.reset_session()
        return {"status": "reset", "client_id": client_id}
    return JSONResponse(
        status_code=404,
        content={"error": "No active session found for this client"}
    )


@app.post("/api/insights")
async def get_insights(data: dict):
    """Generate AI study insights from session data using Gemini."""
    from app.ai_coach import generate_study_insights
    try:
        insights = await asyncio.get_event_loop().run_in_executor(
            None, generate_study_insights, data
        )
        return {"insights": insights}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate insights: {str(e)}"}
        )


@app.post("/api/report")
async def generate_report(data: dict):
    """Generate a PDF session report."""
    from app.pdf_report import generate_session_pdf
    try:
        pdf_bytes = await asyncio.get_event_loop().run_in_executor(
            None, generate_session_pdf, data
        )
        if pdf_bytes is None:
            return JSONResponse(
                status_code=501,
                content={"error": "PDF generation not available. Install reportlab."}
            )
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=concentra-report.pdf"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"PDF generation failed: {str(e)}"}
        )

# ==================== CLASSROOM MODE ====================

from app.classroom import room_manager


@app.post("/api/classroom/create")
async def create_classroom(data: dict):
    """Teacher creates a classroom room."""
    teacher_name = data.get("teacherName", "Teacher")
    room = room_manager.create_room(teacher_name)
    return {"code": room.code, "teacherName": room.teacher_name}


@app.post("/api/classroom/join")
async def join_classroom(data: dict):
    """Student joins a classroom room."""
    code = data.get("code", "").upper()
    student_name = data.get("studentName", "Student")
    client_id = data.get("clientId", "")
    room = room_manager.get_room(code)
    if not room:
        return JSONResponse(status_code=404, content={"error": "Room not found"})
    room_manager.join_room(code, student_name, client_id)
    return {"code": code, "teacherName": room.teacher_name, "studentCount": len(room.students)}


@app.get("/api/classroom/{code}")
async def get_classroom(code: str):
    """Get classroom room info."""
    room = room_manager.get_room(code.upper())
    if not room:
        return JSONResponse(status_code=404, content={"error": "Room not found"})
    return room.to_dict()


@app.post("/api/classroom/{code}/leave")
async def leave_classroom(code: str, data: dict):
    """Student leaves a classroom room."""
    client_id = data.get("clientId", "")
    room_manager.leave_room(code.upper(), client_id)
    return {"status": "left"}


@app.websocket("/ws/classroom/{code}")
async def classroom_teacher_ws(websocket: WebSocket, code: str):
    """Teacher WebSocket — broadcasts live student data every 2 seconds."""
    await websocket.accept()
    room = room_manager.get_room(code.upper())
    if not room:
        await websocket.send_json({"error": "Room not found"})
        await websocket.close()
        return

    room.teacher_ws = websocket
    print(f"[Classroom] Teacher connected to room {code}")

    try:
        while True:
            # Wait for ping or just send updates periodically
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=2.0)
            except asyncio.TimeoutError:
                pass

            # Broadcast current student data
            room = room_manager.get_room(code.upper())
            if room:
                await websocket.send_json(room.to_dict())
            else:
                await websocket.send_json({"error": "Room closed"})
                break
    except Exception as e:
        print(f"[Classroom] Teacher disconnected from room {code}: {e}")
    finally:
        room = room_manager.get_room(code.upper())
        if room:
            room.teacher_ws = None


# ==================== WEBSOCKET ENDPOINT ====================

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """
    WebSocket endpoint for real-time frame processing.

    Client sends:  { "image": "<base64-encoded-jpeg>" }
    Server sends:  { "state": "Focused", "concentration": 85, ... }
    """
    await websocket.accept()

    # Create a detector for this connection
    detector = ConcentrationDetector()
    detectors[client_id] = detector
    print(f"[ConcentraAI] Client connected: {client_id}")

    try:
        while True:
            # Receive frame from client
            data = await websocket.receive_text()
            message = json.loads(data)

            if "image" not in message:
                await websocket.send_json({"error": "Missing 'image' field"})
                continue

            # Decode and process frame
            try:
                frame = detector.decode_base64_frame(message["image"])
                if frame is None:
                    await websocket.send_json({"error": "Failed to decode image"})
                    continue

                # Run ML processing (in thread pool to avoid blocking)
                result = await asyncio.get_event_loop().run_in_executor(
                    None, detector.process_frame, frame
                )

                # Update classroom room if student is in one
                room_code = message.get("roomCode")
                if room_code:
                    room_manager.update_student(
                        room_code, client_id,
                        result["concentration"], result["state"]
                    )

                await websocket.send_json(result)
            except Exception as e:
                await websocket.send_json({"error": f"Processing error: {str(e)}"})

    except WebSocketDisconnect:
        print(f"[ConcentraAI] Client disconnected: {client_id}")
    except Exception as e:
        print(f"[ConcentraAI] Error with client {client_id}: {e}")
    finally:
        # Cleanup
        detector.close()
        detectors.pop(client_id, None)


# ==================== STATIC FILES (Production) ====================
# Serve React build in production
frontend_build = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_build):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_build, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        """Serve React app for all non-API routes (SPA fallback)."""
        file_path = os.path.join(frontend_build, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_build, "index.html"))
