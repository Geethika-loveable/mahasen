import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface IntentAnalysis {
  intent: string;
  confidence: number;
  requires_escalation: boolean;
  escalation_reason: string | null;
  detected_entities: {
    product_mentions: string[];
    issue_type: string | null;
    urgency_level: 'low' | 'medium' | 'high';
  };
}

interface AutomatedTicketParams {
  messageId: string;
  conversationId: string;
  analysis: IntentAnalysis;
  customerName: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  messageContent: string;
  context: string;
}

export class AutomatedTicketService {
  static async generateTicket(params: AutomatedTicketParams) {
    console.log('Starting automated ticket generation with params:', params);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
      const shouldCreateTicket = this.evaluateTicketCreationCriteria(params.analysis);
      
      if (!shouldCreateTicket) {
        console.log('Ticket creation criteria not met');
        return null;
      }

      const priority = this.determinePriority(params.analysis);
      const title = this.generateTicketTitle(params.analysis);
      const ticketType = this.determineTicketType(params.analysis);

      const ticket = {
        title,
        customer_name: params.customerName,
        platform: params.platform,
        type: params.analysis.detected_entities?.issue_type || "General",
        body: params.messageContent,
        message_id: params.messageId,
        conversation_id: params.conversationId,
        intent_type: ticketType,
        context: params.context,
        confidence_score: params.analysis.confidence,
        escalation_reason: params.analysis.escalation_reason || undefined,
        priority,
        status: 'New'
      };

      const { data: createdTicket, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticket)
        .select()
        .single();

      if (ticketError) {
        console.error('Error creating ticket:', ticketError);
        throw ticketError;
      }

      // Create ticket history entry
      const { error: historyError } = await supabase
        .from('ticket_history')
        .insert({
          ticket_id: createdTicket.id,
          action: 'Ticket Created',
          new_status: 'New',
          changed_by: 'System'
        });

      if (historyError) {
        console.error('Error creating ticket history:', historyError);
        throw historyError;
      }

      console.log('Automated ticket created successfully:', createdTicket);
      return createdTicket;
    } catch (error) {
      console.error('Error in automated ticket generation:', error);
      throw error;
    }
  }

  private static evaluateTicketCreationCriteria(analysis: IntentAnalysis): boolean {
    return (
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities?.urgency_level === 'high')
    );
  }

  private static determinePriority(analysis: IntentAnalysis): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (analysis.intent === 'HUMAN_AGENT_REQUEST' || 
        analysis.detected_entities?.urgency_level === 'high') {
      return 'HIGH';
    }
    
    if (analysis.detected_entities?.urgency_level === 'medium') {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private static determineTicketType(analysis: IntentAnalysis): 'SUPPORT' | 'REQUEST' | 'ORDER' {
    switch (analysis.intent) {
      case 'ORDER_PLACEMENT':
        return 'ORDER';
      case 'HUMAN_AGENT_REQUEST':
        return 'REQUEST';
      default:
        return 'SUPPORT';
    }
  }

  private static generateTicketTitle(analysis: IntentAnalysis): string {
    if (analysis.intent === 'HUMAN_AGENT_REQUEST') {
      return 'Human Agent Request';
    }

    const issueType = analysis.detected_entities?.issue_type;
    if (issueType) {
      return `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} Support Request`;
    }

    return 'Support Request';
  }
}