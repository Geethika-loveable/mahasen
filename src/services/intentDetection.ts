import { IntentAnalysis, IntentType, UrgencyLevel } from '@/types/intent';

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
    'human agent'
  ];

  private static readonly ESCALATION_THRESHOLD = 0.7;

  private static calculateIntentClarity(message: string, intent: IntentType): number {
    const explicitMarkers = {
      SUPPORT_REQUEST: ['help', 'issue', 'problem', 'error', 'not working'],
      HUMAN_AGENT_REQUEST: this.HUMAN_AGENT_KEYWORDS,
      ORDER_PLACEMENT: ['buy', 'purchase', 'order', 'price', 'cost'],
      GENERAL_QUERY: ['what', 'how', 'when', 'where', 'can you']
    };

    const markers = explicitMarkers[intent];
    const matchCount = markers.filter(marker => 
      message.toLowerCase().includes(marker.toLowerCase())
    ).length;

    if (matchCount > 2) return 0.4;
    if (matchCount > 0) return 0.3;
    return 0.1;
  }

  private static calculateContextMatch(
    message: string, 
    knowledgeBaseContext: string | null
  ): number {
    if (!knowledgeBaseContext) return 0;

    const messageWords = new Set(message.toLowerCase().split(' '));
    const contextWords = new Set(knowledgeBaseContext.toLowerCase().split(' '));
    
    const intersection = new Set(
      [...messageWords].filter(word => contextWords.has(word))
    );

    const matchRatio = intersection.size / messageWords.size;
    
    if (matchRatio > 0.5) return 0.3;
    if (matchRatio > 0.2) return 0.2;
    return 0.1;
  }

  private static calculateRequiredInfoScore(
    message: string, 
    intent: IntentType
  ): number {
    const requiredInfo = {
      SUPPORT_REQUEST: ['issue', 'tried', 'when', 'error'],
      HUMAN_AGENT_REQUEST: ['reason', 'tried', 'issue'],
      ORDER_PLACEMENT: ['quantity', 'shipping', 'address', 'payment'],
      GENERAL_QUERY: ['question', 'about', 'what']
    };

    const required = requiredInfo[intent];
    const matchCount = required.filter(info => 
      message.toLowerCase().includes(info.toLowerCase())
    ).length;

    const score = (matchCount / required.length) * 0.3;
    return Math.min(score, 0.3);
  }

  private static detectUrgencyLevel(message: string): UrgencyLevel {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately'];
    const mediumKeywords = ['soon', 'important', 'needed'];
    
    if (urgentKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  private static detectProductMentions(message: string): string[] {
    const products: string[] = [];
    return products;
  }

  private static detectIssueType(message: string): string | null {
    const issueTypes = {
      'login': ['login', 'sign in', 'cannot access'],
      'payment': ['payment', 'charge', 'bill'],
      'technical': ['error', 'bug', 'not working'],
      'account': ['account', 'profile', 'settings']
    };

    for (const [type, keywords] of Object.entries(issueTypes)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
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
        confidence: 0.95, // High confidence for explicit requests
        requires_escalation: true,
        escalation_reason: 'Customer explicitly requested human agent',
        detected_entities: {
          product_mentions: [],
          issue_type: 'Human Agent Request',
          urgency_level: 'high' as UrgencyLevel
        }
      };
    }

    let highestConfidence = 0;
    let detectedIntent: IntentType = 'GENERAL_QUERY';

    // Check each intent type
    const intents: IntentType[] = [
      'SUPPORT_REQUEST',
      'HUMAN_AGENT_REQUEST',
      'ORDER_PLACEMENT',
      'GENERAL_QUERY'
    ];

    for (const intent of intents) {
      const intentClarity = this.calculateIntentClarity(message, intent);
      const contextMatch = this.calculateContextMatch(message, knowledgeBaseContext);
      const requiredInfo = this.calculateRequiredInfoScore(message, intent);
      
      const totalConfidence = intentClarity + contextMatch + requiredInfo;
      
      if (totalConfidence > highestConfidence) {
        highestConfidence = totalConfidence;
        detectedIntent = intent;
      }
    }

    const requires_escalation = highestConfidence < this.ESCALATION_THRESHOLD;

    return {
      intent: detectedIntent,
      confidence: highestConfidence,
      requires_escalation,
      escalation_reason: requires_escalation 
        ? 'Low confidence in intent detection' 
        : null,
      detected_entities: {
        product_mentions: this.detectProductMentions(message),
        issue_type: this.detectIssueType(message),
        urgency_level: this.detectUrgencyLevel(message)
      }
    };
  }

  public static generateTicketInfo(
    analysis: IntentAnalysis,
    messageId: string,
    context: string
  ) {
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && analysis.detected_entities.urgency_level === 'high');

    if (!shouldCreateTicket) {
      return null;
    }

    return {
      create_ticket: true,
      ticket_type: analysis.intent === 'ORDER_PLACEMENT' ? 'ORDER' : 'SUPPORT',
      priority: analysis.detected_entities.urgency_level === 'high' ? 'HIGH' :
               analysis.detected_entities.urgency_level === 'medium' ? 'MEDIUM' : 'LOW',
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
      actions.push('Collect shipping information');
      actions.push('Verify product availability');
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