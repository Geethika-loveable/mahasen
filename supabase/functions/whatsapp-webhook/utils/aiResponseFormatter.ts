/**
 * Formats the AI response by removing thinking tags and extracting JSON
 * @param response The raw response from the AI model
 * @returns Parsed JSON object or null if parsing fails
 */
export const formatAIResponse = (response: string) => {
  try {
    console.log('Raw AI response:', response);

    // Remove content between <think> tags including the tags themselves
    let cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Remove any "json" prefix and backticks if they exist
    cleanedResponse = cleanedResponse
      .replace(/^```json\s*/g, '') // Remove ```json prefix
      .replace(/^json\s*/g, '')    // Remove json prefix
      .replace(/```$/g, '')        // Remove ending backticks
      .trim();
    
    console.log('Cleaned response before parsing:', cleanedResponse);
    
    // Parse the remaining content as JSON
    const parsedResponse = JSON.parse(cleanedResponse);
    
    console.log('Successfully parsed AI response:', parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Raw response:', response);
    return null;
  }
};

/**
 * Type guard to check if the parsed response has the expected structure
 */
export const isValidAIResponse = (response: any): boolean => {
  const isValid = response &&
    typeof response === 'object' &&
    typeof response.intent === 'string' &&
    typeof response.confidence === 'number' &&
    typeof response.requires_escalation === 'boolean' &&
    typeof response.response === 'string' &&
    typeof response.detected_entities === 'object' &&
    typeof response.detected_entities.urgency_level === 'string';

  if (!isValid) {
    console.error('Invalid AI response structure:', response);
  }

  return isValid;
};