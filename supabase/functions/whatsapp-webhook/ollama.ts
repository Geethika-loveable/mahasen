import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getAISettings } from './ai-settings.ts';

const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

export async function generateAIResponse(input: string, context: string = ''): Promise<string> {
  try {
    const aiSettings = await getAISettings();
    console.log('Using AI model:', aiSettings.model_name);

    if (aiSettings.model_name === 'gemini-exp-1206') {
      return await generateGeminiResponse(input, context, aiSettings);
    } else {
      return await generateOllamaResponse(input, context, aiSettings);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw error;
  }
}

async function generateOllamaResponse(input: string, context: string, aiSettings: any): Promise<string> {
  console.log('Generating Ollama response for input:', input);
  
  const systemPrompt = `You are the official Customer Care AI assistant of Institute of Computer Engineering Technology (iCET) with access to a knowledge base. Your tone should be ${aiSettings.tone.toLowerCase()}. ${aiSettings.behaviour ? `Behavior instructions: ${aiSettings.behaviour}` : ''}\n${context}`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  return data.response;
}

async function generateGeminiResponse(input: string, context: string, aiSettings: any): Promise<string> {
  console.log('Generating Gemini response for input:', input);
  
  const systemPrompt = `You are the official Customer Care AI of Institute of Computer Engineering Technology - iCET with access to a knowledge base. Your tone should be ${aiSettings.tone.toLowerCase()}. ${aiSettings.behaviour ? `Behavior instructions: ${aiSettings.behaviour}` : ''}\n${context}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `${systemPrompt}\n\nUser Question: ${input}\n\nPlease provide your response`,
          }],
        }],
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
}