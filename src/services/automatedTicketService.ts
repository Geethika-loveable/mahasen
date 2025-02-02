import { IntentAnalysis } from "@/types/intent";
import { Platform, TicketPriority, TicketType } from "@/types/ticket";
import { TicketService } from "./ticketService";

interface AutomatedTicketParams {
  messageId: string;
  conversationId: string;
  analysis: IntentAnalysis;
  customerName: string;
  platform: Platform;
  messageContent: string;
  context: string;
}

export class AutomatedTicketService {
  static async generateTicket(params: AutomatedTicketParams) {
    console.log('Starting automated ticket generation with params:', params);

    try {
      const shouldCreateTicket = this.evaluateTicketCreationCriteria(params.analysis);
      
      if (!shouldCreateTicket) {
        console.log('Ticket creation criteria not met');
        return null;
      }

      const priority = this.determinePriority(params.analysis);
      const title = this.generateTicketTitle(params.analysis);
      const ticketType = this.mapIntentToTicketType(params.analysis.intent);

      const ticket = await TicketService.createTicket({
        title,
        customerName: params.customerName,
        platform: params.platform,
        type: params.analysis.detected_entities?.issue_type || "General",
        body: params.messageContent,
        messageId: params.messageId,
        conversationId: params.conversationId,
        intentType: ticketType,
        context: params.context,
        confidenceScore: params.analysis.confidence,
        escalationReason: params.analysis.escalation_reason || undefined,
        priority
      });

      console.log('Automated ticket created successfully:', ticket);
      return ticket;
    } catch (error) {
      console.error('Error in automated ticket generation:', error);
      throw error;
    }
  }

  private static mapIntentToTicketType(intent: string): TicketType {
    switch (intent) {
      case 'SUPPORT_REQUEST':
        return 'SUPPORT';
      case 'HUMAN_AGENT_REQUEST':
        return 'REQUEST';
      case 'ORDER_PLACEMENT':
        return 'ORDER';
      default:
        return 'SUPPORT';
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

  private static determinePriority(analysis: IntentAnalysis): TicketPriority {
    if (analysis.intent === 'HUMAN_AGENT_REQUEST' || 
        analysis.detected_entities?.urgency_level === 'high') {
      return 'HIGH';
    }
    
    if (analysis.detected_entities?.urgency_level === 'medium') {
      return 'MEDIUM';
    }
    
    return 'LOW';
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