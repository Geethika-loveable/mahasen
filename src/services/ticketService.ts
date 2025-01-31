import { supabase } from "@/integrations/supabase/client";
import { IntentAnalysis } from "@/types/intent";
import { TicketType } from "@/types/ticket";

export class TicketService {
  static async createTicket(
    messageId: string,
    conversationId: string,
    analysis: IntentAnalysis,
    customerName: string,
    platform: 'whatsapp' | 'facebook' | 'instagram',
    messageContent: string,
    context: string
  ) {
    // Determine if we need to create a ticket based on analysis
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && analysis.detected_entities.urgency_level === 'high');

    if (!shouldCreateTicket) {
      return null;
    }

    // Determine ticket type based on intent
    let ticketType: TicketType;
    let title: string;
    let escalationReason = analysis.escalation_reason;

    if (analysis.intent === 'HUMAN_AGENT_REQUEST') {
      ticketType = 'REQUEST';
      title = 'Human Agent Request';
      if (!escalationReason) {
        escalationReason = 'Customer explicitly requested human agent';
      }
    } else if (analysis.intent === 'ORDER_PLACEMENT') {
      ticketType = 'ORDER';
      title = 'New Order Request';
    } else {
      ticketType = 'SUPPORT';
      title = analysis.requires_escalation ? 'Complex Support Request' : 'Support Request';
    }

    const ticketInfo = {
      title,
      customer_name: customerName,
      platform,
      type: analysis.detected_entities.issue_type || 'General',
      body: messageContent,
      message_id: messageId,
      conversation_id: conversationId,
      intent_type: ticketType,
      context,
      confidence_score: analysis.confidence,
      escalation_reason: escalationReason
    };

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketInfo)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }
}