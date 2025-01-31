import { IntentAnalysis, IntentType, TicketCreationInfo, TicketType, TicketPriority } from './types';
import { HUMAN_AGENT_KEYWORDS, INTENT_KEYWORDS } from './keywordMatchers';
import { ContextAnalyzer } from './contextAnalyzer';

export class IntentDetectionService {
  static analyzeIntent(
    message: string,
    knowledgeBaseContext: string | null = null,
    previousMessages: string[] = []
  ): IntentAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // First check for explicit human agent requests
    if (HUMAN_AGENT_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: 'HUMAN_AGENT_REQUEST',
        confidence: 0.95,
        requires_escalation: true,
        escalation_reason: 'Customer explicitly requested human agent',
        detected_entities: {
          product_mentions: [],
          issue_type: ContextAnalyzer.detectIssueType(message),
          urgency_level: ContextAnalyzer.detectUrgencyLevel(message)
        }
      };
    }

    // Calculate context match score
    const contextMatch = knowledgeBaseContext 
      ? ContextAnalyzer.calculateContextMatch(message, knowledgeBaseContext)
      : 0;

    // Determine primary intent
    let primaryIntent: IntentType = 'GENERAL_QUERY';
    let highestConfidence = 0;

    const intents: IntentType[] = [
      'SUPPORT_REQUEST',
      'ORDER_PLACEMENT',
      'GENERAL_QUERY'
    ];

    for (const intent of intents) {
      const confidence = ContextAnalyzer.calculateConfidence(
        message,
        intent,
        contextMatch,
        previousMessages
      );
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        primaryIntent = intent;
      }
    }

    const urgencyLevel = ContextAnalyzer.detectUrgencyLevel(message);
    const { required: requires_escalation, reason: escalation_reason } = 
      ContextAnalyzer.requiresEscalation(primaryIntent, highestConfidence, urgencyLevel);

    return {
      intent: primaryIntent,
      confidence: highestConfidence,
      requires_escalation,
      escalation_reason,
      detected_entities: {
        product_mentions: [],
        issue_type: ContextAnalyzer.detectIssueType(message),
        urgency_level: urgencyLevel
      }
    };
  }

  static generateTicketInfo(
    analysis: IntentAnalysis,
    messageId: string,
    context: string
  ): TicketCreationInfo | null {
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities.urgency_level === 'high');

    if (!shouldCreateTicket) {
      return null;
    }

    const ticketType: TicketType = 
      analysis.intent === 'ORDER_PLACEMENT' ? 'ORDER' : 
      analysis.intent === 'HUMAN_AGENT_REQUEST' ? 'REQUEST' : 'SUPPORT';

    const priority: TicketPriority = 
      analysis.detected_entities.urgency_level === 'high' ? 'HIGH' :
      analysis.detected_entities.urgency_level === 'medium' ? 'MEDIUM' : 'LOW';

    return {
      create_ticket: true,
      ticket_type: ticketType,
      priority,
      context,
      message_id: messageId,
      required_actions: this.generateRequiredActions(analysis)
    };
  }

  private static generateRequiredActions(analysis: IntentAnalysis): string[] {
    const actions: string[] = [];

    if (analysis.requires_escalation) {
      actions.push('Escalate to human agent');
    }

    if (analysis.intent === 'ORDER_PLACEMENT') {
      actions.push('Verify order details');
      actions.push('Check inventory availability');
    }

    if (analysis.intent === 'SUPPORT_REQUEST') {
      actions.push('Review related knowledge base articles');
      if (analysis.detected_entities.issue_type) {
        actions.push(`Check ${analysis.detected_entities.issue_type} documentation`);
      }
    }

    return actions;
  }
}