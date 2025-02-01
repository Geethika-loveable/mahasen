import { supabase } from "@/integrations/supabase/client";
import { IntentAnalysis } from "@/types/intent";
import { TicketType, Platform, TicketStatus, TicketPriority } from "@/types/ticket";

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
    console.log('Creating ticket with analysis:', analysis);
    
    // Enhanced ticket creation logic with more detailed logging
    const shouldCreateTicket = 
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && analysis.detected_entities.urgency_level === 'high');

    if (!shouldCreateTicket) {
      console.log('No ticket needed based on analysis');
      return null;
    }

    // Determine ticket type and priority based on intent and urgency
    let ticketType: TicketType = 'REQUEST';
    let title: string = 'Human Agent Request';
    let priority: TicketPriority = 'HIGH';
    let escalationReason = analysis.escalation_reason || 'Customer explicitly requested human agent';

    if (analysis.intent === 'HUMAN_AGENT_REQUEST') {
      ticketType = 'REQUEST';
      title = 'Human Agent Request';
      priority = 'HIGH';
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

    const ticketData = {
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
      status: 'New' as TicketStatus
    };

    try {
      console.log('Attempting to create ticket with data:', ticketData);
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) {
        console.error('Error creating ticket:', error);
        throw error;
      }
      
      console.log('Created ticket:', data);
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  }
}