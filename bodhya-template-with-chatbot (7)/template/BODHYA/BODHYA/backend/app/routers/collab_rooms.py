"""Feature 18: Real-time collaborative research rooms"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from app.core.supabase_client import supabase
from app.services.websocket_manager import manager

router = APIRouter()


class RoomCreateRequest(BaseModel):
    topic: str
    created_by: str


@router.post("/")
def create_room(req: RoomCreateRequest):
    result = supabase.table("study_rooms").insert(
        {"topic": req.topic, "created_by": req.created_by}
    ).execute()
    return result.data


@router.websocket("/ws/{room_id}")
async def room_socket(websocket: WebSocket, room_id: str):
    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            supabase.table("room_messages").insert(
                {"room_id": room_id, "user_id": data.get("user_id"), "content": data.get("content")}
            ).execute()
            await manager.broadcast(room_id, data)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
