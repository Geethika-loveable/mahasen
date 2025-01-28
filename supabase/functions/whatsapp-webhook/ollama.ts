import { getAISettings } from './ai-settings.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generateGeminiResponse } from './ai-models/gemini.ts';
import { generateOllamaResponse } from './ai-models/ollama.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchKnowledgeBase(userMessage: string, embedding: any): Promise<string> {
  try {
    const { data: matches, error } = await supabase.rpc('match_knowledge_base', {
      query_text: userMessage,
      query_embedding: embedding,
      match_count: 5,
      full_text_weight: 1.0,
      semantic_weight: 1.0,
      match_threshold: 0.5,
      rrf_k: 50
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

export async function generateAIResponse(userMessage: string, conversationHistory: string, aiSettings: any): Promise<string> {
  try {
    console.log('Using AI model:', aiSettings.model_name);

    // Generate embedding for the user's question
    console.log('Generating embedding for user query...');
    const session = new Supabase.ai.Session('gte-small');
    const embedding = await session.run(userMessage, {
      mean_pool: true,
      normalize: true,
    });

    // Search knowledge base with the embedding and user message
    console.log('Searching knowledge base with embedding...');
    const knowledgeBaseContext = await searchKnowledgeBase(userMessage, embedding);

    // Prepare context with knowledge base content
    const fullContext = `${aiSettings.behaviour}\n\nTone: ${aiSettings.tone}\n\nRelevant knowledge base content:\n${knowledgeBaseContext}\n\n${conversationHistory}\n\nUser: ${userMessage}\nAssistant:`;

    if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      return await generateGeminiResponse(fullContext);
    } else {
      return await generateOllamaResponse(fullContext);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
}