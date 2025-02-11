
import { AutomatedTicketService } from '../automatedTicketService.ts';
import { IntentProcessor } from './intent-processor.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Create pending order ticket if we have product and quantity
    if (orderInfo?.product && orderInfo?.quantity && orderInfo?.state === 'CONFIRMING') {
      console.log('Creating pending order ticket...');
      
      try {
        const ticket = await AutomatedTicketService.generateTicket({
          messageId: context.messageId,
          conversationId: context.conversationId,
          analysis: analysis,
          customerName: context.userName,
          platform: context.platform,
          messageContent: `Pending Order: ${orderInfo.product} x ${orderInfo.quantity}`,
          context: `Product: ${orderInfo.product}\nQuantity: ${orderInfo.quantity}`,
          productInfo: {
            product: orderInfo.product,
            quantity: orderInfo.quantity,
            confirmed: false
          }
        });

        if (ticket) {
          return `Please confirm your order with a "Yes", "Ow", or "ඔව්". Once confirmed, we'll process your enrollment right away!`;
        }
      } catch (error) {
        console.error('Error creating pending order ticket:', error);
      }
    }

    // Process confirmed order
    if (orderInfo?.state === 'PROCESSING' && orderInfo?.confirmed) {
      console.log('Processing confirmed order...');
      
      try {
        // Find and update pending order if it exists
        if (orderInfo.pendingOrderId) {
          const { data: updatedTicket, error } = await supabase
            .from('tickets')
            .update({ 
              order_status: 'confirmed',
              product_info: JSON.stringify({
                ...orderInfo,
                confirmed: true
              })
            })
            .eq('id', orderInfo.pendingOrderId)
            .select()
            .single();

          if (!error && updatedTicket) {
            return `Your Order for ${orderInfo.product} for ${orderInfo.quantity} is placed successfully. Order Number is ${updatedTicket.id}.`;
          }
        }

        // Create new confirmed order ticket if no pending order exists
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
        }
      } catch (error) {
        console.error('Error processing confirmed order:', error);
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
