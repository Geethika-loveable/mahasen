import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function generateAIResponse(input: string): Promise<string> {
  try {
    console.log('Fetching AI settings...');
    
    // Get current AI model setting with error handling
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      throw new Error('Failed to fetch AI settings');
    }

    if (!aiSettings) {
      console.error('No AI settings found, using default Ollama model');
      return await generateOllamaResponse(input);
    }

    console.log('AI Settings found:', aiSettings);
    console.log('Using AI model:', aiSettings.model_name);

    // Explicitly check the model name and use the appropriate service
    if (aiSettings.model_name === 'llama3.2:latest') {
      console.log('Using Ollama for response generation');
      return await generateOllamaResponse(input);
    } else if (aiSettings.model_name === 'gemini-exp-1206') {
      console.log('Using Gemini for response generation');
      return await generateGeminiResponse(input);
    } else {
      console.warn('Unknown model, falling back to Ollama');
      return await generateOllamaResponse(input);
    }
  } catch (error) {
    console.error('Error in generateAIResponse:', error);
    throw error;
  }
}

async function generateOllamaResponse(input: string): Promise<string> {
  try {
    console.log('Generating Ollama response for input:', input);
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
    console.log('Ollama response received successfully');
    return data.response;
  } catch (error) {
    console.error('Error generating Ollama response:', error);
    throw error;
  }
}

async function generateGeminiResponse(input: string): Promise<string> {
  try {
    console.log('Generating Gemini response for input:', input);
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
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini response received successfully');
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}