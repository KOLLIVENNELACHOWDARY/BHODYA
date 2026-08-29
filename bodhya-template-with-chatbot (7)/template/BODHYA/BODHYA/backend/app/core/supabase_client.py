"""
Shared Supabase client for the backend. Uses the SERVICE ROLE key
(server-side only — never send this key to the frontend) so it can read
and write across all tables regardless of row-level security policies.
"""
from supabase import create_client, Client
from app.core.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
