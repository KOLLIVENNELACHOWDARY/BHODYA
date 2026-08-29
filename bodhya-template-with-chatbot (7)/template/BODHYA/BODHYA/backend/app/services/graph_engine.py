"""
Personal knowledge graph helpers: adding topics/edges, computing mastery,
and suggesting the next topic to study based on prerequisite edges.
Owner of feature #4 (Personal Knowledge Graph): build this out.
"""


def suggest_next_topic(user_id: str) -> str | None:
    # TODO: query knowledge_nodes/knowledge_edges via app.core.supabase_client
    # and return the highest-priority unmastered topic whose prerequisites
    # are already mastered.
    raise NotImplementedError
