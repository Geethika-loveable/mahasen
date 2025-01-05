import { getAISettings } from './ai-settings.ts';

export async function generateAIResponse(userMessage: string, conversationHistory: string, aiSettings: any): Promise<string> {
  try {
    console.log('Using AI model:', aiSettings.model_name);

    if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      return await generateGeminiResponse(userMessage, conversationHistory, aiSettings);
    } else {
      return await generateOllamaResponse(userMessage, conversationHistory, aiSettings);
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
}

async function generateGeminiResponse(userMessage: string, conversationHistory: string, aiSettings: any): Promise<string> {
  console.log('Generating Gemini response for input:', userMessage);
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
            text: `${aiSettings.behaviour}\n\nTone: ${aiSettings.tone}\n\n${conversationHistory}\n\nUser: ${userMessage}\nAssistant:`
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

async function generateOllamaResponse(userMessage: string, conversationHistory: string, aiSettings: any): Promise<string> {
  const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `${aiSettings.behaviour}\n\nTone: ${aiSettings.tone}\n\n${conversationHistory}\n\nUser: ${userMessage}\nAssistant:`,
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