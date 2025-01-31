import { IntentType, UrgencyLevel } from './types';
import { HUMAN_AGENT_KEYWORDS, URGENCY_KEYWORDS, ISSUE_TYPES, INTENT_KEYWORDS } from './keywordMatchers';

export class ContextAnalyzer {
  static calculateContextMatch(message: string, context: string): number {
    if (!context) return 0;
    
    const messageWords = new Set(message.toLowerCase().split(' '));
    const contextWords = new Set(context.toLowerCase().split(' '));
    const intersection = new Set([...messageWords].filter(word => contextWords.has(word)));
    
    return intersection.size / messageWords.size;
  }

  static detectUrgencyLevel(message: string): UrgencyLevel {
    const lowerMessage = message.toLowerCase();
    
    if (URGENCY_KEYWORDS.high.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (URGENCY_KEYWORDS.medium.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  static detectIssueType(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    for (const [type, keywords] of Object.entries(ISSUE_TYPES)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return type;
      }
    }
    return null;
  }

  static calculateConfidence(
    message: string,
    intent: IntentType,
    contextMatch: number,
    previousMessages: string[] = []
  ): number {
    const lowerMessage = message.toLowerCase();
    let confidence = 0;

    // Check for explicit human agent request
    if (intent === 'HUMAN_AGENT_REQUEST' && 
        HUMAN_AGENT_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      return 0.95;
    }

    // Calculate keyword matches
    const keywords = INTENT_KEYWORDS[intent] || [];
    const keywordMatches = keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    ).length;

    // Base confidence from keyword matches
    confidence = keywordMatches > 0 ? 0.3 + (keywordMatches * 0.1) : 0.1;

    // Add context bonus
    confidence += contextMatch * 0.3;

    // Consider previous messages
    if (previousMessages.length > 0) {
      const repeatedIntentBonus = previousMessages.some(msg => 
        keywords.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()))
      ) ? 0.1 : 0;
      confidence += repeatedIntentBonus;
    }

    // Cap confidence at 1.0
    return Math.min(confidence, 1.0);
  }

  static requiresEscalation(
    intent: IntentType,
    confidence: number,
    urgencyLevel: UrgencyLevel
  ): { required: boolean; reason: string | null } {
    if (confidence < 0.7) {
      return { 
        required: true, 
        reason: 'Low confidence in automated response' 
      };
    }

    if (urgencyLevel === 'high') {
      return { 
        required: true, 
        reason: 'High urgency request requires immediate attention' 
      };
    }

    if (intent === 'HUMAN_AGENT_REQUEST') {
      return { 
        required: true, 
        reason: 'Customer explicitly requested human agent' 
      };
    }

    if (intent === 'SUPPORT_REQUEST' && urgencyLevel !== 'low') {
      return { 
        required: true, 
        reason: 'Complex support request requires human assistance' 
      };
    }

    return { required: false, reason: null };
  }
}