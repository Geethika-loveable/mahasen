import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function getRecentConversationHistory(userId: string, aiSettings: any): Promise<string> {
  try {
    const timeoutHours = aiSettings.conversation_timeout_hours || 1;
    const contextLength = aiSettings.context_memory_length || 2;
    
    const timeoutAgo = new Date(Date.now() - (timeoutHours * 60 * 60 * 1000)).toISOString();
    console.log(`Getting messages newer than: ${timeoutAgo} (${timeoutHours} hours ago)`);
    console.log(`Using context memory length: ${contextLength}`);
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (convError || !conversations?.length) {
      console.log('No recent conversation found');
      return '';
    }

    const conversationId = conversations[0].id;
    const pairsToFetch = contextLength * 2;

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('content, sender_name, created_at')
      .eq('conversation_id', conversationId)
      .gt('created_at', timeoutAgo)
      .order('created_at', { ascending: false })
      .limit(pairsToFetch);

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return '';
    }

    if (!messages?.length) {
      console.log('No recent messages found within timeout period');
      return '';
    }

    const orderedMessages = messages.reverse();
    const history = orderedMessages
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n');

    console.log('Retrieved conversation history:', history);
    return history ? `\nRecent conversation history:\n${history}` : '';
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return '';
  }
}

export async function processWhatsAppMessage(
  messageId: string,
  userMessage: string,
  userId: string,
  userName: string
): Promise<void> {
  try {
    // Fetch AI settings
    console.log('Fetching AI settings...');
    const aiSettings = await getAISettings();
    console.log('AI settings retrieved:', aiSettings);

    // Get conversation history using AI settings
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);
    console.log('Retrieved conversation history:', conversationHistory);

    // Generate AI response using the retrieved settings
    const aiResponse = await generateAIResponse(userMessage, conversationHistory, aiSettings);
    console.log('AI Response:', aiResponse);
    
    // Send response back via WhatsApp
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
    await sendWhatsAppMessage(userId, aiResponse, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);

    // Store the conversation
    await storeConversation(supabase, userId, userName, userMessage, aiResponse);
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}