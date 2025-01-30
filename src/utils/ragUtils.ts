import { supabase } from "@/integrations/supabase/client";

export async function searchKnowledgeBase(query: string) {
  try {
    console.log('Generating embedding for query:', query);
    
    // Generate embedding for the query
    const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke(
      'generate-embedding',
      {
        body: { text: query }
      }
    );

    if (embeddingError) {
      console.error('Error generating embedding:', embeddingError);
      return null;
    }

    console.log('Generated embedding, searching knowledge base');

    // Search knowledge base using the embedding
    const { data: matches, error: searchError } = await supabase.rpc(
      'match_knowledge_base',
      {
        query_text: query,
        query_embedding: embeddingData.embedding,
        match_count: 3,
        full_text_weight: 0.5,
        semantic_weight: 0.5
      }
    );

    if (searchError) {
      console.error('Error searching knowledge base:', searchError);
      return null;
    }

    console.log('Found matches:', matches);
    return matches;
  } catch (error) {
    console.error('Error in searchKnowledgeBase:', error);
    return null;
  }
}

export function formatKnowledgeBaseContext(matches: Array<{ content: string }> | null): string {
  if (!matches || matches.length === 0) {
    return '';
  }

  const contextPieces = matches.map(match => match.content.trim());
  return `Here is some relevant context from the knowledge base:\n\n${contextPieces.join('\n\n')}\n\nPlease use this context to help answer the question.`;
}