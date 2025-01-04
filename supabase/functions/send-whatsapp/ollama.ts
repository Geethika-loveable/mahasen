export async function getAIResponse(prompt: string, model: string, OLLAMA_BASE_URL: string, GEMINI_API_KEY: string, context: string = ''): Promise<string> {
  try {
    if (model === 'llama3.2:latest') {
      return getOllamaResponse(prompt, OLLAMA_BASE_URL, context);
    } else if (model === 'gemini-exp-1206') {
      return getGeminiResponse(prompt, GEMINI_API_KEY, context);
    } else {
      throw new Error('Invalid model specified');
    }
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}

async function getOllamaResponse(prompt: string, OLLAMA_BASE_URL: string, context: string = ''): Promise<string> {
  try {
    console.log('Using Ollama base URL:', OLLAMA_BASE_URL);
    
    const systemPrompt = context ? 
      `You are a helpful AI assistant with access to a knowledge base. ${context}` :
      'Please provide a general response if no specific information is available.';

    const ollamaUrl = `${OLLAMA_BASE_URL}/api/generate`;
    console.log('Full Ollama URL:', ollamaUrl);

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3.2:latest",
        prompt: `${systemPrompt}\n\nUser Question: ${prompt}\n\nPlease provide your response:`,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Ollama API responded with status: ${response.status}. Body: ${errorText}`);
    }

    const text = await response.text();
    console.log('Raw Ollama response:', text);

    try {
      const data = JSON.parse(text);
      if (!data.response) {
        console.error('Unexpected Ollama response format:', data);
        throw new Error('Invalid response format from Ollama');
      }
      return data.response;
    } catch (parseError) {
      console.error('Error parsing Ollama response:', parseError);
      throw new Error('Invalid JSON response from Ollama');
    }
  } catch (error) {
    console.error('Error getting Ollama response:', error);
    throw error;
  }
}

async function getGeminiResponse(prompt: string, GEMINI_API_KEY: string, context: string = ''): Promise<string> {
  try {
    const systemPrompt = context ? 
      `You are a helpful AI assistant with access to a knowledge base. ${context}` :
      'Please provide a general response if no specific information is available.';

    const fullPrompt = `${systemPrompt}\n\nUser Question: ${prompt}`;
    
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
              role: "user",
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 64,
            topP: 0.95,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Gemini API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw Gemini response:', data);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    throw error;
  }
}