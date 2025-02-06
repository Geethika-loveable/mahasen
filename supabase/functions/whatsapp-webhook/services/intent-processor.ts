
import { IntentAnalysis } from '../types/intent.ts';

interface IntentProcessorConfig {
  confidence_threshold: number;
  urgency_levels: string[];
  intent_types: string[];
}

export class IntentProcessor {
  private static readonly DEFAULT_CONFIG: IntentProcessorConfig = {
    confidence_threshold: 0.7,
    urgency_levels: ['high', 'medium', 'low'],
    intent_types: ['HUMAN_AGENT_REQUEST', 'SUPPORT_REQUEST', 'ORDER_PLACEMENT', 'GENERAL_QUERY']
  };

  static validateIntentStructure(response: any): boolean {
    if (!response || typeof response !== 'object') return false;

    const requiredFields = [
      'intent',
      'confidence',
      'requires_escalation',
      'detected_entities',
      'response'
    ];

    return requiredFields.every(field => field in response) &&
           typeof response.confidence === 'number' &&
           typeof response.requires_escalation === 'boolean' &&
           this.DEFAULT_CONFIG.intent_types.includes(response.intent) &&
           this.validateDetectedEntities(response.detected_entities);
  }

  private static validateDetectedEntities(entities: any): boolean {
    if (!entities || typeof entities !== 'object') return false;

    const requiredFields = [
      'product_mentions',
      'issue_type',
      'urgency_level'
    ];

    return requiredFields.every(field => field in entities) &&
           Array.isArray(entities.product_mentions) &&
           (entities.issue_type === null || typeof entities.issue_type === 'string') &&
           this.DEFAULT_CONFIG.urgency_levels.includes(entities.urgency_level);
  }

  static evaluateEscalationNeeds(analysis: IntentAnalysis): boolean {
    return analysis.requires_escalation ||
           analysis.intent === 'HUMAN_AGENT_REQUEST' ||
           (analysis.intent === 'SUPPORT_REQUEST' && 
            analysis.detected_entities.urgency_level === 'high');
  }

  static processOrderInfo(orderInfo: any): any {
    if (!orderInfo) {
      return {
        product: null,
        quantity: 1,
        state: 'COLLECTING_INFO',
        confirmed: false
      };
    }

    return {
      ...orderInfo,
      quantity: orderInfo.quantity || 1
    };
  }
}
