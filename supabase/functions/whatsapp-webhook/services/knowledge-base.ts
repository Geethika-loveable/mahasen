
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function searchKnowledgeBase(query_embedding: string, threshold = 0.5, count = 5): Promise<string> {
  try {
    console.log('Searching knowledge base with embedding...');
    
    const { data: matches, error } = await supabase.rpc('match_knowledge_base', {
      query_embedding,
      match_threshold: threshold,
      match_count: count
    });

    if (error) {
      console.error('Error searching knowledge base:', error);
      return '';
    }

    if (!matches || matches.length === 0) {
      console.log('No relevant matches found in knowledge base');
      return '';
    }

    const contextContent = matches
      .map(match => match.content)
      .join('\n\n');

    console.log('Found relevant knowledge base content:', contextContent);
    return contextContent;
  } catch (error) {
    console.error('Error in knowledge base search:', error);
    return '';
  }
}
