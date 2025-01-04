import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function generateAIResponse(input: string): Promise<string> {
  try {
    // Get current AI model setting
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('model_name')
      .single();

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      throw new Error('Failed to fetch AI settings');
    }

    const modelName = aiSettings?.model_name || 'llama3.2:latest';

    if (modelName === 'llama3.2:latest') {
      return await generateOllamaResponse(input);
    } else {
      return await generateGeminiResponse(input);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

async function generateOllamaResponse(input: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: input,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating Ollama response:', error);
    throw error;
  }
}

async function generateGeminiResponse(input: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: input,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 64,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}