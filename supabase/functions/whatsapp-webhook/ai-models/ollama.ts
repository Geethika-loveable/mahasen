export async function generateOllamaResponse(context: string): Promise<string> {
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