export async function generateGeminiResponse(context: string): Promise<string> {
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