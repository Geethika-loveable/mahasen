import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { WhatsAppMessage } from "@/types/chat";
import { useToast } from "@/hooks/use-toast";
import { IntentDetectionService } from "@/services/intent/intentDetectionService";
import { TicketService } from "@/services/ticketService";
import { useIntentDetection } from "@/hooks/useIntentDetection";

export const useMessageSending = (
  id: string | undefined,
  contactNumber: string | undefined,
  refetchMessages: () => void,
  isAIEnabled: boolean
) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { analyzeMessage } = useIntentDetection();

  const sendMessage = async (newMessage: string) => {
    if (!newMessage.trim() || !id || !contactNumber) return;
    
    setIsSending(true);
    try {
      console.log('Starting message sending process...');
      
      // First, store the message in our database
      const { data: messageData, error: dbError } = await supabase.from("messages").insert({
        conversation_id: id,
        content: newMessage,
        status: "sent",
        sender_name: "Agent",
        sender_number: "system",
      }).select().single();

      if (dbError) {
        console.error('Database error storing message:', dbError);
        throw dbError;
      }

      console.log('Message stored successfully:', messageData);

      // Get conversation data for context
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", id)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        throw convError;
      }

      console.log('Conversation data retrieved:', conversation);

      // Get recent messages for context
      const { data: recentMessages, error: msgError } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (msgError) {
        console.error('Error fetching recent messages:', msgError);
        throw msgError;
      }

      const previousMessages = recentMessages?.map(msg => msg.content) || [];
      console.log('Previous messages retrieved:', previousMessages);

      // Analyze message intent with more context
      console.log('Starting intent analysis...');
      const { analysis, ticketInfo } = analyzeMessage(
        newMessage,
        messageData.id,
        null,
        conversation?.contact_name || 'Unknown',
        previousMessages
      );

      console.log('Intent analysis completed:', analysis);
      console.log('Ticket info:', ticketInfo);

      // Create ticket if needed
      if (messageData && conversation && ticketInfo) {
        const shouldCreateTicket = 
          analysis.intent === 'HUMAN_AGENT_REQUEST' ||
          (analysis.intent === 'SUPPORT_REQUEST' && analysis.detected_entities.urgency_level === 'high') ||
          analysis.requires_escalation;

        console.log('Should create ticket:', shouldCreateTicket, 'Based on analysis:', analysis);

        if (shouldCreateTicket) {
          try {
            console.log('Attempting to create ticket...');
            const ticketData = {
              title: ticketInfo.title || "Human Agent Request",
              customer_name: conversation.contact_name,
              platform: conversation.platform,
              type: analysis.detected_entities.issue_type || "General",
              body: newMessage,
              message_id: messageData.id,
              conversation_id: id,
              intent_type: analysis.intent,
              context: previousMessages.join('\n'),
              confidence_score: analysis.confidence,
              escalation_reason: analysis.escalation_reason || "Customer requested human agent",
              priority: analysis.detected_entities.urgency_level === 'high' ? 'HIGH' : 
                       analysis.detected_entities.urgency_level === 'medium' ? 'MEDIUM' : 'LOW',
              status: 'New'
            };

            console.log('Ticket data prepared:', ticketData);

            const { data: ticket, error: ticketError } = await supabase
              .from('tickets')
              .insert(ticketData)
              .select()
              .single();

            if (ticketError) {
              console.error('Error creating ticket:', ticketError);
              throw ticketError;
            }

            console.log('Ticket created successfully:', ticket);

            toast({
              title: "Ticket Created",
              description: "A support ticket has been created for this request.",
            });
          } catch (ticketError) {
            console.error('Failed to create ticket:', ticketError);
            toast({
              variant: "destructive",
              title: "Error Creating Ticket",
              description: "Failed to create support ticket. Please try again.",
            });
          }
        }
      }

      // Send the message through WhatsApp using the Edge Function
      const messagePayload: WhatsAppMessage = {
        to: contactNumber,
        message: newMessage,
        type: "text",
        useAI: false
      };

      console.log('Sending WhatsApp message...');
      const { error: whatsappError } = await supabase.functions.invoke(
        'send-whatsapp',
        {
          body: messagePayload,
        }
      );

      if (whatsappError) {
        console.error('WhatsApp sending error:', whatsappError);
        throw whatsappError;
      }

      console.log('WhatsApp message sent successfully');
      refetchMessages();
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error) {
      console.error("Error in message sending process:", error);
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendMessage,
    isSending,
  };
};