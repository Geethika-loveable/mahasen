
export function formatAIResponse(responseText: string): any {
  try {
    // Remove <think> tags and their content
    let cleanedResponse = responseText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Remove ```json and ``` markers if they exist
    cleanedResponse = cleanedResponse.replace(/```json\n/g, '').replace(/```/g, '').trim();
    
    // Handle potential string responses
    if (!cleanedResponse.startsWith('{')) {
      return {
        response: cleanedResponse,
        intent: 'GENERAL_QUERY',
        confidence: 0.5,
        requires_escalation: false,
        escalation_reason: null,
        detected_entities: {
          product_mentions: [],
          issue_type: null,
          urgency_level: 'low',
          order_info: null
        }
      };
    }

    // Parse the JSON
    const parsedResponse = JSON.parse(cleanedResponse);
    
    console.log('Parsed AI response:', parsedResponse);
    
    // Ensure all required fields are present
    if (!this.isValidAIResponse(parsedResponse)) {
      console.error('Invalid response structure:', parsedResponse);
      return this.getDefaultResponse();
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Error formatting AI response:', error);
    console.log('Raw response:', responseText);
    
    return this.getDefaultResponse();
  }

  private static isValidAIResponse(response: any): boolean {
    return (
      response &&
      typeof response === 'object' &&
      typeof response.intent === 'string' &&
      typeof response.confidence === 'number' &&
      typeof response.requires_escalation === 'boolean' &&
      typeof response.response === 'string' &&
      typeof response.detected_entities === 'object' &&
      typeof response.detected_entities.urgency_level === 'string' &&
      Array.isArray(response.detected_entities.product_mentions)
    );
  }

  private static getDefaultResponse() {
    return {
      response: "I apologize, but I received an invalid response format. Please try again.",
      intent: 'GENERAL_QUERY',
      confidence: 0.5,
      requires_escalation: false,
      escalation_reason: null,
      detected_entities: {
        product_mentions: [],
        issue_type: null,
        urgency_level: 'low',
        order_info: null
      }
    };
  }
}

export function isValidAIResponse(response: any): boolean {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.intent === 'string' &&
    typeof response.confidence === 'number' &&
    typeof response.requires_escalation === 'boolean' &&
    typeof response.response === 'string' &&
    typeof response.detected_entities === 'object' &&
    typeof response.detected_entities.urgency_level === 'string'
  );
}

export function extractResponseText(parsedResponse: any): string {
  if (typeof parsedResponse === 'string') {
    return parsedResponse;
  }
  
  if (parsedResponse && parsedResponse.response) {
    return parsedResponse.response;
  }
  
  return 'I apologize, but I encountered an error processing your request.';
}
