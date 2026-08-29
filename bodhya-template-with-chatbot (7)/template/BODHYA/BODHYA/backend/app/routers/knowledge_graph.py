"""Feature 4: Personal Knowledge Graph"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.supabase_client import supabase
from app.services import graph_engine

router = APIRouter()


class AddTopicRequest(BaseModel):
    user_id: str
    topic: str


@router.post("/topic")
def add_topic(req: AddTopicRequest):
    result = supabase.table("knowledge_nodes").insert(
        {"user_id": req.user_id, "topic": req.topic}
    ).execute()
    return result.data


@router.get("/{user_id}")
def get_graph(user_id: str):
    nodes = supabase.table("knowledge_nodes").select("*").eq("user_id", user_id).execute()
    edges = supabase.table("knowledge_edges").select("*").eq("user_id", user_id).execute()
    return {"nodes": nodes.data, "edges": edges.data}


@router.get("/{user_id}/next-topic")
def next_topic(user_id: str):
    return {"suggested_topic": graph_engine.suggest_next_topic(user_id)}
