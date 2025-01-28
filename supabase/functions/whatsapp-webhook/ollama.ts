import { getAISettings } from './ai-settings.ts';

export async function generateAIResponse(message: string, conversationHistory: string, aiSettings: any): Promise<string> {
  try {
    if (aiSettings.model_name === 'groq-llama-3.3-70b') {
      return await generateGroqResponse(message, conversationHistory, aiSettings);
    } else if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      return await generateGeminiResponse(message, conversationHistory, aiSettings);
    } else {
      throw new Error('Invalid model specified');
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}

async function generateGroqResponse(message: string, conversationHistory: string, aiSettings: any): Promise<string> {
  const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const systemPrompt = `You are an AI assistant with a ${aiSettings.tone} tone. ${aiSettings.behaviour || ''}`;
  const fullPrompt = `${systemPrompt}\n\n${conversationHistory}\nUser: ${message}\nAssistant:`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${conversationHistory}\n${message}` }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData
      });
      throw new Error(`Groq API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error getting Groq response:', error);
    throw error;
  }
}

async function generateGeminiResponse(message: string, conversationHistory: string, aiSettings: any): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are an AI assistant with a ${aiSettings.tone} tone. ${aiSettings.behaviour || ''}` }]
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate Gemini response');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
