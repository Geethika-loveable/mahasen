import { IntentAnalysis, IntentType, UrgencyLevel, TicketCreationInfo, TicketType, TicketPriority } from '@/types/intent';

export class IntentDetectionService {
  private static readonly HUMAN_AGENT_KEYWORDS = [
    'speak to human',
    'real person',
    'agent',
    'representative',
    'supervisor',
    'connect to human',
    'talk to human',
    'real human',
    'human agent',
    'need help',
    'frustrated',
    'not helping',
    'useless'
  ];

  private static readonly URGENCY_KEYWORDS = {
    high: ['urgent', 'emergency', 'asap', 'immediately', 'right now', 'critical'],
    medium: ['soon', 'important', 'needed', 'waiting', 'priority'],
    low: []
  };

  private static readonly ISSUE_TYPES = {
    technical: ['error', 'bug', 'not working', 'broken', 'failed', 'issue'],
    billing: ['payment', 'charge', 'bill', 'invoice', 'refund', 'subscription'],
    account: ['login', 'password', 'access', 'account', 'profile'],
    product: ['product', 'item', 'order', 'delivery', 'shipping']
  };

  private static calculateConfidence(
    message: string,
    intent: IntentType,
    contextMatch: number
  ): number {
    const keywordMatches = {
      HUMAN_AGENT_REQUEST: this.HUMAN_AGENT_KEYWORDS,
      SUPPORT_REQUEST: ['help', 'support', 'issue', 'problem', 'error'],
      ORDER_PLACEMENT: ['buy', 'purchase', 'order', 'price', 'cost'],
      GENERAL_QUERY: ['what', 'how', 'when', 'where', 'can you']
    };

    const keywords = keywordMatches[intent];
    const matchCount = keywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    const baseConfidence = matchCount > 0 ? 0.3 + (matchCount * 0.1) : 0.1;
    const contextBonus = contextMatch * 0.3;
    
    return Math.min(baseConfidence + contextBonus, 1.0);
  }

  private static detectUrgencyLevel(message: string): UrgencyLevel {
    const lowerMessage = message.toLowerCase();
    
    if (this.URGENCY_KEYWORDS.high.some(keyword => lowerMessage.includes(keyword))) {
      return 'high';
    }
    if (this.URGENCY_KEYWORDS.medium.some(keyword => lowerMessage.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private static detectIssueType(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.ISSUE_TYPES)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return type;
      }
    }
    return null;
  }

  static analyzeIntent(
    message: string,
    knowledgeBaseContext: string | null = null
  ): IntentAnalysis {
    const lowerMessage = message.toLowerCase();
    
    // First check for explicit human agent requests
    if (this.HUMAN_AGENT_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
      return {
        intent: 'HUMAN_AGENT_REQUEST',
        confidence: 0.95,
        requires_escalation: true,
        escalation_reason: 'Customer explicitly requested human agent',
        detected_entities: {
          product_mentions: [],
          issue_type: this.detectIssueType(message),
          urgency_level: this.detectUrgencyLevel(message)
        }
      };
    }

    // Calculate context match score
    const contextMatch = knowledgeBaseContext 
      ? this.calculateContextMatch(message, knowledgeBaseContext)
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
      const confidence = this.calculateConfidence(message, intent, contextMatch);
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        primaryIntent = intent;
      }
    }

    const urgencyLevel = this.detectUrgencyLevel(message);
    const requires_escalation = 
      highestConfidence < 0.7 || 
      urgencyLevel === 'high' ||
      (primaryIntent === 'SUPPORT_REQUEST' && urgencyLevel !== 'low');

    return {
      intent: primaryIntent,
      confidence: highestConfidence,
      requires_escalation,
      escalation_reason: requires_escalation 
        ? this.getEscalationReason(primaryIntent, highestConfidence, urgencyLevel)
        : null,
      detected_entities: {
        product_mentions: [],
        issue_type: this.detectIssueType(message),
        urgency_level: urgencyLevel
      }
    };
  }

  private static calculateContextMatch(message: string, context: string): number {
    const messageWords = new Set(message.toLowerCase().split(' '));
    const contextWords = new Set(context.toLowerCase().split(' '));
    
    const intersection = new Set(
      [...messageWords].filter(word => contextWords.has(word))
    );

    return intersection.size / messageWords.size;
  }

  private static getEscalationReason(
    intent: IntentType,
    confidence: number,
    urgency: UrgencyLevel
  ): string {
    if (confidence < 0.7) {
      return 'Low confidence in automated response';
    }
    if (urgency === 'high') {
      return 'High urgency request requires immediate attention';
    }
    if (intent === 'SUPPORT_REQUEST') {
      return 'Complex support request requires human assistance';
    }
    return 'Request requires human verification';
  }

  public static generateTicketInfo(
    analysis: IntentAnalysis,
    messageId: string,
    context: string
  ): TicketCreationInfo | null {
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && analysis.detected_entities.urgency_level === 'high');

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