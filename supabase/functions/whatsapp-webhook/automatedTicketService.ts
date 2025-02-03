import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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
  messageId: string; // This will now be our UUID
  conversationId: string;
  analysis: IntentAnalysis;
  customerName: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  messageContent: string;
  context: string;
}

export class AutomatedTicketService {
  static async generateTicket(params: AutomatedTicketParams) {
    console.log('Starting ticket generation with params:', params);
    
    const shouldCreateTicket = this.evaluateTicketCreationCriteria(params.analysis);
    console.log('Ticket creation criteria met:', shouldCreateTicket);
    
    if (shouldCreateTicket) {
      const ticketData = {
        title: this.generateTicketTitle(params.analysis),
        customer_name: params.customerName,
        platform: params.platform,
        type: params.analysis.detected_entities?.issue_type || "General",
        body: params.messageContent,
        message_id: params.messageId,
        conversation_id: params.conversationId,
        intent_type: this.determineTicketType(params.analysis),
        context: params.context,
        confidence_score: params.analysis.confidence,
        escalation_reason: params.analysis.escalation_reason || undefined,
        priority: this.determinePriority(params.analysis),
        status: 'New'
      };

      console.log('Attempting to create ticket with data:', ticketData);

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }

      console.log('Successfully created ticket:', ticket);
      return ticket;
    }
    
    return null;
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

  private static determineTicketType(analysis: IntentAnalysis): string {
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