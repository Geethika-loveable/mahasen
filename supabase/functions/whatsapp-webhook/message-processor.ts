import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function validateConversation(userId: string): Promise<string> {
  console.log('Validating conversation for user:', userId);
  
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("contact_number", userId)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    throw new Error(`Failed to validate conversation: ${error.message}`);
  }

  if (!conversation) {
    console.error('No conversation found for user:', userId);
    throw new Error('No conversation found');
  }

  console.log('Validated conversation:', conversation);
  return conversation.id;
}

async function createTicket(
  messageId: string,
  conversationId: string,
  analysis: any,
  customerName: string,
  platform: 'whatsapp' | 'facebook' | 'instagram',
  messageContent: string,
  context: string
) {
  try {
    console.log('Creating ticket with data:', {
      messageId,
      conversationId,
      analysis,
      customerName,
      platform,
      messageContent
    });

    // Validate required fields
    if (!messageId || !conversationId || !analysis || !customerName || !platform || !messageContent) {
      throw new Error('Missing required fields for ticket creation');
    }

    const ticketData = {
      title: analysis.intent === 'HUMAN_AGENT_REQUEST' 
        ? 'Human Agent Request' 
        : `${analysis.detected_entities?.issue_type || 'Support'} Request`,
      customer_name: customerName,
      platform,
      type: analysis.detected_entities?.issue_type || "General",
      body: messageContent,
      message_id: messageId,
      conversation_id: conversationId,
      intent_type: analysis.intent,
      context: context,
      confidence_score: analysis.confidence,
      escalation_reason: analysis.escalation_reason,
      priority: analysis.detected_entities?.urgency_level === 'high' ? 'HIGH' : 
               analysis.detected_entities?.urgency_level === 'medium' ? 'MEDIUM' : 'LOW',
      status: 'New'
    };

    console.log('Prepared ticket data:', ticketData);

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      console.error('Database error creating ticket:', ticketError);
      throw ticketError;
    }

    console.log('Ticket created successfully:', ticket);
    return ticket;
  } catch (error) {
    console.error('Failed to create ticket:', error);
    throw error;
  }
}

export async function processWhatsAppMessage(
  messageId: string,
  userMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  try {
    console.log('Starting message processing:', {
      messageId,
      userMessage,
      userId,
      userName
    });

    // Get conversation ID first to ensure it exists
    let conversationId: string;
    try {
      conversationId = await validateConversation(userId);
    } catch (error) {
      console.error('Failed to validate conversation:', error);
      throw error;
    }

    // Fetch AI settings
    const aiSettings = await getAISettings();
    console.log('AI settings retrieved:', aiSettings);

    // Get conversation history
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);
    console.log('Retrieved conversation history:', conversationHistory);

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage, conversationHistory, aiSettings);
    console.log('AI Response:', aiResponse);
    
    // Extract response text and check ticket creation criteria
    const responseText = typeof aiResponse === 'object' ? aiResponse.response || aiResponse.content : aiResponse;
    
    // Send WhatsApp response
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
    await sendWhatsAppMessage(userId, responseText, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);

    // Store the conversation
    await storeConversation(supabase, userId, userName, userMessage, responseText);

    // Check if we need to create a ticket
    if (typeof aiResponse === 'object') {
      const shouldCreateTicket = 
        aiResponse.requires_escalation ||
        aiResponse.intent === 'HUMAN_AGENT_REQUEST' ||
        (aiResponse.intent === 'SUPPORT_REQUEST' && 
         aiResponse.detected_entities?.urgency_level === 'high');

      console.log('Ticket creation check:', {
        shouldCreateTicket,
        intent: aiResponse.intent,
        requires_escalation: aiResponse.requires_escalation,
        urgency_level: aiResponse.detected_entities?.urgency_level
      });

      if (shouldCreateTicket) {
        try {
          const ticket = await createTicket(
            messageId,
            conversationId,
            aiResponse,
            userName,
            'whatsapp',
            userMessage,
            conversationHistory
          );
          console.log('Ticket created successfully:', ticket);
        } catch (ticketError) {
          console.error('Failed to create ticket:', ticketError);
          // Don't throw here to prevent message processing from failing
          // but we should log it for monitoring
        }
      }
    }
  } catch (error) {
    console.error('Error in message processing:', error);
    throw error;
  }
}

async function getRecentConversationHistory(userId: string, aiSettings: any): Promise<string> {
  try {
    console.log('Fetching conversation history for user:', userId);
    
    // Get the conversation ID for this user
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (!conversation) {
      console.log('No existing conversation found for user');
      return '';
    }

    // Fetch recent messages based on AI settings context length
    const { data: messages, error } = await supabase
      .from("messages")
      .select("content, sender_name, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(aiSettings.context_memory_length || 2);

    if (error) {
      console.error('Error fetching conversation history:', error);
      return '';
    }

    if (!messages || messages.length === 0) {
      console.log('No message history found');
      return '';
    }

    // Format messages into a string
    const formattedHistory = messages
      .reverse()
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n');

    console.log('Retrieved conversation history:', formattedHistory);
    return formattedHistory;
  } catch (error) {
    console.error('Error in getRecentConversationHistory:', error);
    return '';
  }
}
