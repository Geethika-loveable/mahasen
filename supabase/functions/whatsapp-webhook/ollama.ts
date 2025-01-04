import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function generateAIResponse(input: string,context: string = ''): Promise<string> {
  try {
    // Get current AI model setting with error handling
    const { data: aiSettings, error: settingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      throw new Error('Failed to fetch AI settings');
    }

    if (!aiSettings) {
      console.error('No AI settings found');
      // Use default Gemini model if no settings found. 
      //return await generateGeminiResponse(input,context);
      return await generateGemini2FlashResponse(input,context);
      //return await generateOllamaResponse(input,context);
    }

    const modelName = aiSettings.model_name;
    console.log('Using AI model:', modelName);

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

async function generateOllamaResponse(input: string,context: string = ''): Promise<string> {
  try {
    const systemPrompt = `You are the official Customer Care AI assistant of Institute of Computer Engineering Technology (iCET) with access to a knowledge base. Give concise answers. \n ${context} \n 
    Please provide a general response if no specific information to the user question is available.`;

    console.log('Generating Ollama response for input:', input);
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `${systemPrompt}\n\nUser Question: ${input}\n\nPlease provide your response`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Ollama response received');
    return data.response;
  } catch (error) {
    console.error('Error generating Ollama response:', error);
    throw error;
  }
}

async function generateGeminiResponse(input: string, context: string = ''): Promise<string> {
  try {
    const systemPrompt = `You are the official Customer Care AI assistant of iCET with access to a knowledge base. Give concise answers always. \n ${context} \n 
    Please provide a general response if no specific information to the user question is available.`;

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
                  text: `${systemPrompt}\n\nUser Question: ${input}\n\nPlease provide your response`,
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
    console.log('Gemini response received');
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

async function generateGemini2FlashResponse(input: string, context: string = ''): Promise<string> {
  try {
    const systemPrompt = `You are the official Customer Care AI of Institute of Computer Engineering Technology - iCET with access to a knowledge base. Always try to Give concise answers. Help with whatever the user asks.\n ${context} \n 
    Please provide a general response if no specific information to the user question is available. give the answer in a well structured, formatted way suitable for whatsapp. Don't use more than 1 "*" to bold. "- " for a bullet point for lists. Use emojis for better understanding.`;

    console.log('Generating Gemini response for input:', input);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
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
                  text: `${systemPrompt}\n\nUser Question: ${input}\n\nPlease provide your response`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 64,
            topP: 0.95,
            maxOutputTokens: 1024,
            responseMimeType: "text/plain"
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini response received');
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}