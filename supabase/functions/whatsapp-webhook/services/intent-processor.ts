
export class IntentProcessor {
  private static readonly DEFAULT_CONFIG = {
    confidence_threshold: 0.7,
    urgency_levels: ['high', 'medium', 'low'],
    intent_types: ['HUMAN_AGENT_REQUEST', 'SUPPORT_REQUEST', 'ORDER_PLACEMENT', 'GENERAL_QUERY']
  };

  private static readonly CONFIRMATION_WORDS = ['yes', 'ow', 'ඔව්'];

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

  static isConfirmationMessage(message: string): boolean {
    return this.CONFIRMATION_WORDS.includes(message.toLowerCase().trim());
  }

  static async processOrderInfo(orderInfo: any, message?: string, conversationId?: string): Promise<any> {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // If there's no existing order info, create initial state
    if (!orderInfo) {
      return {
        product: null,
        quantity: 1,
        state: 'COLLECTING_INFO',
        confirmed: false
      };
    }

    // Handle confirmation messages
    if (message && this.isConfirmationMessage(message) && conversationId) {
      // Check for pending order in the tickets table
      const { data: pendingOrder, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('type', 'Order')
        .eq('order_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingOrder && !error) {
        console.log('Found pending order:', pendingOrder);
        const productInfo = pendingOrder.product_info;
        
        return {
          product: productInfo.product,
          quantity: productInfo.quantity,
          state: 'PROCESSING',
          confirmed: true,
          pendingOrderId: pendingOrder.id
        };
      }
    }

    // If we have a product but haven't asked for confirmation yet
    if (orderInfo.product && orderInfo.state === 'COLLECTING_INFO') {
      return {
        ...orderInfo,
        state: 'CONFIRMING',
        confirmed: false
      };
    }

    return {
      ...orderInfo,
      quantity: orderInfo.quantity || 1
    };
  }
}
