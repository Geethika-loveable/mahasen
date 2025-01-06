import { getAISettings } from './ai-settings.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function searchKnowledgeBase(embedding: any): Promise<string> {
  try {
    const { data: matches, error } = await supabase.rpc('match_knowledge_base', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5
    });

    if (error) {
      console.error('Error searching knowledge base:', error);
      return '';
    }

    if (!matches || matches.length === 0) {
      console.log('No relevant matches found in knowledge base');
      return '';
    }

    // Combine relevant content from matches
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

    // First, generate embedding for the user's question
    console.log('Generating embedding for user query...');
    const session = new Supabase.ai.Session('gte-small');
    const embedding = await session.run(userMessage, {
      mean_pool: true,
      normalize: true,
    });

    // Search knowledge base with the embedding
    console.log('Searching knowledge base with embedding...');
    const knowledgeBaseContext = await searchKnowledgeBase(embedding);

    // Prepare context with knowledge base content
    const fullContext = `${aiSettings.behaviour}\n\nTone: ${aiSettings.tone}\n\nRelevant knowledge base content:\n${knowledgeBaseContext}\n\n${conversationHistory}\n\nUser: ${userMessage}\nAssistant:`;

    if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      return await generateGeminiResponse(fullContext, aiSettings);
    } else {
      return await generateOllamaResponse(fullContext, aiSettings);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
}

async function generateGeminiResponse(context: string, aiSettings: any): Promise<string> {
  console.log('Generating Gemini response for context:', context);
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: context
          }]
        }]
      })
    });

    const data = await response.json();
    console.log('Gemini response received');
    
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw error;
  }
}

async function generateOllamaResponse(context: string, aiSettings: any): Promise<string> {
  const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: context,
        stream: false
      })
    });

    const data = await response.json();
    return data.response.trim();
  } catch (error) {
    console.error('Error with Ollama API:', error);
    throw error;
  }
}