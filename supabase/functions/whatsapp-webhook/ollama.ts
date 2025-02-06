import { AIContext, AIResponse, AISettings } from "./types/ai-response.ts";
import { generateGroqResponse, generateGeminiResponse } from "./services/model-service.ts";
import { formatAIResponse, isValidAIResponse } from "./utils/aiResponseFormatter.ts";

export async function generateAIResponse(
  message: string, 
  context: AIContext, 
  aiSettings: AISettings
): Promise<string> {
  try {
    let responseText: string;
    
    if (aiSettings.model_name === 'llama-3.3-70b-versatile') {
      responseText = await generateGroqResponse(message, context, aiSettings);
    } else if (aiSettings.model_name === 'gemini-2.0-flash-exp') {
      responseText = await generateGeminiResponse(message, context, aiSettings);
    } else if (aiSettings.model_name === 'deepseek-r1-distill-llama-70b') {
      responseText = await generateGroqResponse(message, context, aiSettings);
    } else {
      throw new Error('Invalid model specified');
    }

    const parsedResponse = formatAIResponse(responseText);
    
    if (!parsedResponse || !isValidAIResponse(parsedResponse)) {
      console.error('Invalid response format:', parsedResponse);
      throw new Error('Invalid response format from AI model');
    }

    return parsedResponse.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now. Please try again later.";
  }
}