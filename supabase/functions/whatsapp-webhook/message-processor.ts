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
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("contact_number", userId)
      .single();

    if (conversationError) {
      throw new Error(`Failed to fetch conversation: ${conversationError.message}`);
    }

    if (!conversation) {
      throw new Error('No conversation found');
    }

    console.log('Found conversation:', conversation);

    // Fetch AI settings and conversation history
    const aiSettings = await getAISettings();
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);

    // Create context object with all required fields
    const context = {
      userName,
      messageId,
      conversationId: conversation.id,
      knowledgeBase: conversationHistory,
      userMessage
    };

    console.log('Prepared context for AI response:', context);

    // Generate AI response
    const aiResponse = await generateAIResponse(userMessage, context, aiSettings);
    console.log('Generated AI response:', aiResponse);

    if (!aiResponse) {
      throw new Error('Failed to generate AI response');
    }

    // Extract response text
    const responseText = typeof aiResponse === 'object' ? aiResponse.response || aiResponse.content : aiResponse;

    if (!responseText) {
      throw new Error('Invalid AI response format');
    }

    // Send WhatsApp response
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
    
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_ID) {
      throw new Error('Missing WhatsApp configuration');
    }

    const whatsappResponse = await sendWhatsAppMessage(userId, responseText, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);
    
    if (!whatsappResponse) {
      throw new Error('Failed to send WhatsApp message');
    }

    // Store the conversation
    await storeConversation(supabase, userId, userName, userMessage, responseText);

  } catch (error) {
    console.error('Error in message processing:', error);
    
    // Store the error in webhook_errors table
    const { error: insertError } = await supabase
      .from('webhook_errors')
      .insert({
        error_type: 'WHATSAPP_PROCESSING_ERROR',
        message: error.message,
        details: {
          messageId,
          userId,
          userName,
          timestamp: new Date().toISOString(),
          stack: error.stack
        }
      });

    if (insertError) {
      console.error('Failed to log webhook error:', insertError);
    }

    throw error; // Re-throw the error to trigger Lovable's error handling
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