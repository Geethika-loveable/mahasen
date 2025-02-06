import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function matchKnowledgeBase(query: string): Promise<string> {
  try {
    console.log('Matching knowledge base for query:', query);
    
    // Call the match_knowledge_base function
    const { data: matches, error } = await supabase.rpc(
      'match_knowledge_base',
      {
        query_text: query,
        match_count: 3,
        full_text_weight: 1.0,
        semantic_weight: 1.0,
        match_threshold: 0.5
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