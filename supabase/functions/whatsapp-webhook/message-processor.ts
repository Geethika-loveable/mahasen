import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';
import { AutomatedTicketService } from './automatedTicketService.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function processWhatsAppMessage(
  messageId: string,
  userMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  console.log('Starting message processing:', {
    messageId,
    userMessage,
    userId,
    userName
  });

  try {
    // Get conversation ID first
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (!conversation) {
      throw new Error('No conversation found');
    }

    console.log('Found conversation:', conversation);

    // Fetch AI settings and conversation history
    const aiSettings = await getAISettings();
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage, conversationHistory, aiSettings);
    console.log('Generated AI response:', aiResponse);

    // Extract response text
    const responseText = typeof aiResponse === 'object' ? aiResponse.response || aiResponse.content : aiResponse;

    // Send WhatsApp response
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
    await sendWhatsAppMessage(userId, responseText, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);

    // Store the conversation
    await storeConversation(supabase, userId, userName, userMessage, responseText);

    // Handle ticket creation if needed
    if (typeof aiResponse === 'object' && 'intent' in aiResponse) {
      try {
        await AutomatedTicketService.generateTicket({
          messageId,
          conversationId: conversation.id,
          analysis: aiResponse,
          customerName: userName,
          platform: 'whatsapp',
          messageContent: userMessage,
          context: conversationHistory
        });
      } catch (ticketError) {
        console.error('Failed to create ticket:', ticketError);
        throw ticketError;
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
    
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (!conversation) {
      console.log('No existing conversation found for user');
      return '';
    }

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
