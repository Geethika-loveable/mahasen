/**
 * Formats the AI response based on the model type and removes any thinking/system prompts
 * @param response The raw response from the AI model
 * @param modelName The name of the AI model used
 * @returns Formatted response string
 */
export const formatAIResponse = (response: string, modelName: string): string => {
  // Handle Deepseek model specific formatting
  if (modelName.includes('deepseek')) {
    // Remove content between <think> tags including the tags themselves
    return response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  }

  // For other models, return the response as is
  return response.trim();
};