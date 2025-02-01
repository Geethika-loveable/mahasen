import { supabase } from "@/integrations/supabase/client";
import { IntentAnalysis } from "@/types/intent";
import { TicketType } from "@/types/ticket";
import type { Platform, TicketStatus } from "@/types/ticket";

export class TicketService {
  static async createTicket(
    messageId: string,
    conversationId: string,
    analysis: IntentAnalysis,
    customerName: string,
    platform: Platform,
    messageContent: string,
    context: string
  ) {
    // Enhanced ticket creation logic
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && analysis.detected_entities.urgency_level === 'high');

    if (!shouldCreateTicket) {
      return null;
    }

    // Determine ticket type and priority based on intent and urgency
    let ticketType: TicketType;
    let title: string;
    let priority: 'HIGH' | 'MEDIUM' | 'LOW';
    let escalationReason = analysis.escalation_reason;

    if (analysis.intent === 'HUMAN_AGENT_REQUEST') {
      ticketType = 'REQUEST';
      title = 'Human Agent Request';
      priority = 'HIGH';
      if (!escalationReason) {
        escalationReason = 'Customer explicitly requested human agent';
      }
    } else if (analysis.intent === 'ORDER_PLACEMENT') {
      ticketType = 'ORDER';
      title = 'New Order Request';
      priority = analysis.detected_entities.urgency_level === 'high' ? 'HIGH' : 'MEDIUM';
    } else {
      ticketType = 'SUPPORT';
      title = analysis.requires_escalation ? 'Complex Support Request' : 'Support Request';
      priority = analysis.detected_entities.urgency_level === 'high' ? 'HIGH' : 
                analysis.detected_entities.urgency_level === 'medium' ? 'MEDIUM' : 'LOW';
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
      escalation_reason: escalationReason,
      priority,
      status: 'New' as TicketStatus // Explicitly type as TicketStatus enum
    };

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketInfo)
        .select()
        .single();

      if (error) throw error;
      
      console.log('Created ticket:', data);
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }
}