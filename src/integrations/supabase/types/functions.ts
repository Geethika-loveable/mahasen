export interface DatabaseFunctions {
  match_knowledge_base: {
    Args: {
      query_text: string
      query_embedding: string
      match_count?: number
      full_text_weight?: number
      semantic_weight?: number
      match_threshold?: number
      rrf_k?: number
    }
    Returns: {
      id: string
      content: string
      similarity: number
    }[]
  }
}