import { IntentAnalysis } from "@/types/intent";
import { Platform, TicketPriority, TicketType } from "@/types/ticket";
import { TicketService } from "./ticketService";
import { toast } from "@/hooks/use-toast";

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

      console.log('Proceeding with ticket creation...');

      const priority = this.determinePriority(params.analysis);
      const title = this.generateTicketTitle(params.analysis);
      const ticketType = this.determineTicketType(params.analysis);

      const ticketData = {
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
      };

      console.log('Attempting to create ticket with data:', ticketData);

      try {
        const ticket = await TicketService.createTicket(ticketData);
        console.log('Ticket created successfully:', ticket);
        
        toast({
          title: "Ticket Created",
          description: `Ticket #${ticket.id} has been created for ${params.customerName}`,
        });

        return ticket;
      } catch (ticketError) {
        console.error('Error in TicketService.createTicket:', ticketError);
        toast({
          variant: "destructive",
          title: "Failed to Create Ticket",
          description: ticketError instanceof Error ? ticketError.message : "An unknown error occurred",
        });
        throw ticketError;
      }
    } catch (error) {
      console.error('Error in automated ticket generation:', error);
      toast({
        variant: "destructive",
        title: "Automated Ticket Generation Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
      throw error;
    }
  }

  private static evaluateTicketCreationCriteria(analysis: IntentAnalysis): boolean {
    const shouldCreate = (
      analysis.requires_escalation ||
      analysis.intent === 'HUMAN_AGENT_REQUEST' ||
      (analysis.intent === 'SUPPORT_REQUEST' && 
       analysis.detected_entities?.urgency_level === 'high')
    );
    
    console.log('Ticket creation criteria evaluation:', {
      analysis,
      shouldCreate,
      reason: shouldCreate ? 'Criteria met' : 'Criteria not met'
    });

    return shouldCreate;
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

  private static determineTicketType(analysis: IntentAnalysis): TicketType {
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