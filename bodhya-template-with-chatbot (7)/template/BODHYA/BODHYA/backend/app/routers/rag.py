"""Features 16-17: Upload PDFs/docs/images + query (RAG), and curating
reliable study material from webscrapes/books."""
from fastapi import APIRouter, UploadFile
from pydantic import BaseModel
from app.core.supabase_client import supabase
from app.services import llm_router

router = APIRouter()


@router.post("/upload")
async def upload_document(user_id: str, file: UploadFile):
    # TODO: push file bytes to a Supabase Storage bucket, then chunk +
    # embed the text into document_chunks (pgvector) for retrieval.
    contents = await file.read()
    doc = supabase.table("uploaded_documents").insert(
        {
            "user_id": user_id,
            "file_name": file.filename,
            "storage_path": f"uploads/{user_id}/{file.filename}",
            "source_type": "pdf" if file.filename.endswith(".pdf") else "doc",
        }
    ).execute()
    return {"document": doc.data, "bytes_received": len(contents)}


class QueryRequest(BaseModel):
    user_id: str
    question: str


@router.post("/query")
async def query_documents(req: QueryRequest):
    # TODO: embed req.question, run a pgvector similarity search against
    # document_chunks, then feed the top chunks + question into llm_router.
    answer = await llm_router.generate(req.question)
    return {"answer": answer, "sources": []}
