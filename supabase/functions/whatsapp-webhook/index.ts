import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Set to store processed message IDs
const processedMessages = new Set();

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getRecentConversationHistory(supabase: any, userId: string, timeoutHours: number): Promise<string> {
  try {
    const timeoutAgo = new Date(Date.now() - (timeoutHours * 60 * 60 * 1000)).toISOString();
    console.log(`Getting messages newer than: ${timeoutAgo} (${timeoutHours} hours ago)`);
    
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

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('content, sender_name, created_at')
      .eq('conversation_id', conversationId)
      .gt('created_at', timeoutAgo)
      .order('created_at', { ascending: true })
      .limit(4);

    if (msgError) {
      console.error('Error fetching messages:', msgError);
      return '';
    }

    if (!messages?.length) {
      console.log('No recent messages found within timeout period');
      return '';
    }

    const history = messages
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n');

    return history ? `\nRecent conversation history:\n${history}` : '';
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return '';
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle webhook verification
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!;

    if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    return new Response('Verification failed', { 
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }

  if (req.method === 'POST') {
    try {
      const message = await req.json();
      console.log('WhatsApp API response:', JSON.stringify(message));

      const changes = message.entry[0].changes[0].value;
      
      if (!changes.messages || changes.messages.length === 0) {
        return new Response('No messages in webhook', { 
          status: 200,
          headers: corsHeaders 
        });
      }

      const messageId = changes.messages[0].id;
      
      // Check if we've already processed this message
      if (processedMessages.has(messageId)) {
        console.log(`Message ${messageId} already processed, skipping`);
        return new Response(JSON.stringify({ success: true, status: 'already_processed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Add message to processed set
      processedMessages.add(messageId);
      
      // Clean up old message IDs (keep last 1000)
      if (processedMessages.size > 1000) {
        const idsToRemove = Array.from(processedMessages).slice(0, processedMessages.size - 1000);
        idsToRemove.forEach(id => processedMessages.delete(id));
      }

      const userMessage = changes.messages[0].text.body;
      const userId = changes.contacts[0].wa_id;
      const userName = changes.contacts[0].profile.name;

      console.log(`Received message from ${userName} (${userId}): ${userMessage}`);

      // Fetch AI settings once
      console.log('Fetching AI settings...');
      const aiSettings = await getAISettings();
      console.log('AI settings retrieved:', aiSettings);

      // Get conversation history
      const conversationHistory = await getRecentConversationHistory(supabase, userId, aiSettings.conversation_timeout_hours || 1);
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

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  });
});
