"""
Minimal in-memory WebSocket connection manager for real-time
collaborative research rooms. Good enough for a single backend instance
(hackathon scale). If you need multiple backend instances later, swap
this for Supabase Realtime channels or Redis pub/sub instead.
"""
from fastapi import WebSocket
from collections import defaultdict


class RoomConnectionManager:
    def __init__(self):
        self.rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        self.rooms[room_id].append(websocket)

    def disconnect(self, room_id: str, websocket: WebSocket):
        if websocket in self.rooms[room_id]:
            self.rooms[room_id].remove(websocket)

    async def broadcast(self, room_id: str, message: dict):
        for connection in self.rooms[room_id]:
            await connection.send_json(message)


manager = RoomConnectionManager()
