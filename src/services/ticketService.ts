import { supabase } from "@/integrations/supabase/client";
import { IntentAnalysis } from "@/types/intent";
import { TicketCreationInfo, TicketType } from "@/types/ticket";

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
    let ticketType: TicketType;
    let title: string;
    let shouldCreateTicket = false;
    let escalationReason = analysis.escalation_reason;

    // Determine if we should create a ticket based on triggers
    if (analysis.confidence < 0.7) {
      shouldCreateTicket = true;
      escalationReason = 'Low confidence in intent detection';
    }

    if (analysis.intent === 'HUMAN_AGENT_REQUEST') {
      shouldCreateTicket = true;
      ticketType = 'REQUEST';
      title = 'Human Agent Request';
    } else if (analysis.intent === 'ORDER_PLACEMENT') {
      shouldCreateTicket = true;
      ticketType = 'ORDER';
      title = 'New Order Request';
    } else if (analysis.intent === 'SUPPORT_REQUEST') {
      if (analysis.requires_escalation) {
        shouldCreateTicket = true;
        ticketType = 'SUPPORT';
        title = 'Complex Support Request';
      }
    }

    if (!shouldCreateTicket) {
      return null;
    }

    const ticketInfo: TicketCreationInfo = {
      title: title!,
      customer_name: customerName,
      platform,
      type: analysis.detected_entities.issue_type || 'General',
      body: messageContent,
      message_id: messageId,
      conversation_id: conversationId,
      intent_type: ticketType!,
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