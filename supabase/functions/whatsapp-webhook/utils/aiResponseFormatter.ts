export function formatAIResponse(responseText: string): any {
  try {
    // Remove <think> tags and their content if present
    const cleanedResponse = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Try to parse as JSON
    const parsedResponse = JSON.parse(cleanedResponse);
    return parsedResponse;
  } catch (error) {
    console.error('Error formatting AI response:', error);
    console.log('Raw response:', responseText);
    
    // If parsing fails, return the raw text
    return {
      response: responseText,
      intent: 'GENERAL_QUERY',
      confidence: 0.5,
      requires_escalation: false,
      escalation_reason: null,
      detected_entities: {
        product_mentions: [],
        issue_type: null,
        urgency_level: 'low'
      }
    };
  }
}

export function isValidAIResponse(response: any): boolean {
  return (
    response &&
    typeof response.intent === 'string' &&
    typeof response.confidence === 'number' &&
    typeof response.requires_escalation === 'boolean' &&
    (response.escalation_reason === null || typeof response.escalation_reason === 'string') &&
    response.detected_entities &&
    Array.isArray(response.detected_entities.product_mentions) &&
    (response.detected_entities.issue_type === null || typeof response.detected_entities.issue_type === 'string') &&
    ['low', 'medium', 'high'].includes(response.detected_entities.urgency_level)
  );
}