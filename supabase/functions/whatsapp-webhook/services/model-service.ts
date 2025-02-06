import { AIContext, AIResponse, AISettings } from "../types/ai-response.ts";

export async function generateGroqResponse(
  message: string,
  context: AIContext,
  aiSettings: AISettings
): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const systemPrompt = generateSystemPrompt(context, aiSettings);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiSettings.model_name === 'deepseek-r1-distill-llama-70b' ? 'deepseek-r1-distill-llama-70b' : 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error with Groq API:', error);
    throw error;
  }
}

export async function generateGeminiResponse(
  message: string,
  context: AIContext,
  aiSettings: AISettings
): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const intentDetectionPrompt = generateSystemPrompt(context, aiSettings);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${intentDetectionPrompt}\n\nUser message: ${message}\n\nProvide your analysis and response in the specified JSON format:` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 1000,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate Gemini response');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error with Gemini API:', error);
    throw error;
  }
}