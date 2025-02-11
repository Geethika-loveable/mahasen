
import { AutomatedTicketService } from '../automatedTicketService.ts';
import { IntentProcessor } from './intent-processor.ts';

interface TicketContext {
  messageId: string;
  conversationId: string;
  userName: string;
  platform: 'whatsapp' | 'facebook' | 'instagram';
  messageContent: string;
  knowledgeBase?: string;
}

export class TicketHandler {
  static async handleTicketCreation(
    analysis: any,
    context: TicketContext
  ): Promise<string | null> {
    console.log('TicketHandler: Starting ticket creation with analysis:', analysis);

    // Handle order tickets
    if (analysis.intent === 'ORDER_PLACEMENT') {
      return await this.handleOrderTicket(analysis, context);
    }

    // Handle support tickets
    if (IntentProcessor.evaluateEscalationNeeds(analysis)) {
      await this.createSupportTicket(analysis, context);
    }

    return null;
  }

  private static async handleOrderTicket(analysis: any, context: TicketContext): Promise<string | null> {
    const orderInfo = analysis.detected_entities.order_info;
    console.log('Processing order ticket with info:', orderInfo);
    
    // Only proceed if we have product and quantity and confirmation
    if (orderInfo?.product && 
        orderInfo?.quantity && 
        orderInfo?.state === 'PROCESSING' && 
        orderInfo?.confirmed) {
      
      console.log('Creating confirmed order ticket...');
      
      try {
        const ticket = await AutomatedTicketService.generateTicket({
          messageId: context.messageId,
          conversationId: context.conversationId,
          analysis: analysis,
          customerName: context.userName,
          platform: context.platform,
          messageContent: `Order: ${orderInfo.product} x ${orderInfo.quantity}`,
          context: `Product: ${orderInfo.product}\nQuantity: ${orderInfo.quantity}`,
          productInfo: {
            product: orderInfo.product,
            quantity: orderInfo.quantity,
            confirmed: true
          }
        });

        if (ticket) {
          return `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${ticket.id}.`;
        } else {
          return "Order failed. Please retry with correct Product & Quantity in a bit.";
        }
      } catch (error) {
        console.error('Error creating order ticket:', error);
        return "Order failed. Please retry with correct Product & Quantity in a bit.";
      }
    }

    return null;
  }

  private static async createSupportTicket(analysis: any, context: TicketContext): Promise<void> {
    try {
      await AutomatedTicketService.generateTicket({
        messageId: context.messageId,
        conversationId: context.conversationId,
        analysis: analysis,
        customerName: context.userName,
        platform: context.platform,
        messageContent: context.messageContent,
        context: context.knowledgeBase || ''
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }
}
