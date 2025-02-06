import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateEmbedding(text: string): Promise<string> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

export async function matchKnowledgeBase(query: string): Promise<string> {
  try {
    console.log('Matching knowledge base for query:', query);
    
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    console.log('Generated embedding for query');
    
    // Call the match_knowledge_base function with both query_text and query_embedding
    const { data: matches, error } = await supabase.rpc(
      'match_knowledge_base',
      {
        query_text: query,
        query_embedding: queryEmbedding,
        match_count: 3,
        full_text_weight: 1.0,
        semantic_weight: 1.0,
        match_threshold: 0.5,
        rrf_k: 50
      }
    );

    if (error) {
      console.error('Error matching knowledge base:', error);
      return '';
    }

    if (!matches || matches.length === 0) {
      console.log('No knowledge base matches found');
      return '';
    }

    // Combine the matched content
    const combinedContent = matches
      .map(match => match.content)
      .join('\n\n');

    console.log('Found knowledge base matches:', matches.length);
    return combinedContent;

  } catch (error) {
    console.error('Error in matchKnowledgeBase:', error);
    return '';
  }
}