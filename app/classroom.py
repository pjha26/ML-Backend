"""
Classroom Mode — Room management for teacher-student live monitoring.
Teachers create rooms, students join with a code, teacher sees live focus grid.
"""
import random
import string
import time
from dataclasses import dataclass, field


def _generate_code(length=6):
    """Generate a random room code (uppercase letters + digits)."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


@dataclass
class StudentData:
    """Live data for a student in a room."""
    name: str
    client_id: str
    concentration: float = 0.0
    state: str = "Absent"
    joined_at: float = field(default_factory=time.time)
    last_update: float = field(default_factory=time.time)


@dataclass
class Room:
    """A classroom room."""
    code: str
    teacher_name: str
    created_at: float = field(default_factory=time.time)
    students: dict = field(default_factory=dict)  # client_id -> StudentData
    teacher_ws: object = None  # WebSocket connection for teacher

    def to_dict(self):
        return {
            "code": self.code,
            "teacherName": self.teacher_name,
            "studentCount": len(self.students),
            "createdAt": self.created_at,
            "students": [
                {
                    "clientId": s.client_id,
                    "name": s.name,
                    "concentration": s.concentration,
                    "state": s.state,
                    "lastUpdate": s.last_update,
                }
                for s in self.students.values()
            ],
        }


class RoomManager:
    """Manages classroom rooms."""

    def __init__(self):
        self.rooms: dict[str, Room] = {}  # code -> Room

    def create_room(self, teacher_name: str) -> Room:
        """Create a new room with a unique code."""
        code = _generate_code()
        while code in self.rooms:
            code = _generate_code()
        room = Room(code=code, teacher_name=teacher_name)
        self.rooms[code] = room
        print(f"[Classroom] Room {code} created by {teacher_name}")
        return room

    def get_room(self, code: str) -> Room | None:
        return self.rooms.get(code.upper())

    def join_room(self, code: str, student_name: str, client_id: str) -> bool:
        """Add a student to a room."""
        room = self.get_room(code)
        if not room:
            return False
        room.students[client_id] = StudentData(
            name=student_name, client_id=client_id
        )
        print(f"[Classroom] {student_name} joined room {code}")
        return True

    def leave_room(self, code: str, client_id: str):
        """Remove a student from a room."""
        room = self.get_room(code)
        if room and client_id in room.students:
            name = room.students[client_id].name
            del room.students[client_id]
            print(f"[Classroom] {name} left room {code}")

    def update_student(self, code: str, client_id: str, concentration: float, state: str):
        """Update a student's live data."""
        room = self.get_room(code)
        if room and client_id in room.students:
            student = room.students[client_id]
            student.concentration = concentration
            student.state = state
            student.last_update = time.time()

    def close_room(self, code: str):
        """Close and remove a room."""
        if code in self.rooms:
            print(f"[Classroom] Room {code} closed")
            del self.rooms[code]

    def cleanup_stale(self, max_age_hours=24):
        """Remove rooms older than max_age_hours."""
        now = time.time()
        stale = [
            code for code, room in self.rooms.items()
            if now - room.created_at > max_age_hours * 3600
        ]
        for code in stale:
            self.close_room(code)


# Global singleton
room_manager = RoomManager()
