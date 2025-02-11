
import { IntentProcessor } from './intent-processor.ts';
import { formatAIResponse, isValidAIResponse } from '../utils/aiResponseFormatter.ts';

export class ResponseProcessor {
  static async processAIResponse(rawResponse: string, userMessage?: string, conversationId?: string): Promise<any> {
    try {
      console.log('Processing raw AI response:', rawResponse);

      // First attempt to format and validate the response
      const formattedResponse = formatAIResponse(rawResponse);
      
      if (!isValidAIResponse(formattedResponse)) {
        console.error('Invalid response structure after formatting:', formattedResponse);
        return this.getDefaultResponse();
      }

      console.log('Formatted AI response:', formattedResponse);

      // Process order info if present
      if (formattedResponse.intent === 'ORDER_PLACEMENT') {
        try {
          formattedResponse.detected_entities.order_info = 
            await IntentProcessor.processOrderInfo(
              formattedResponse.detected_entities.order_info,
              userMessage,
              conversationId
            );
        } catch (error) {
          console.error('Error processing order info:', error);
          return this.getDefaultResponse();
        }
      }

      return formattedResponse;
    } catch (error) {
      console.error('Error processing AI response:', error);
      return this.getDefaultResponse();
    }
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
