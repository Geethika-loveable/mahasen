import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { storeConversation } from "./database.ts";
import { generateAIResponse } from "./ai-response.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function processMessage(event: any) {
  const senderId = event.sender.id;
  const message = event.message.text;
  const pageId = event.recipient.id;

  try {
    // Get Facebook page access token
    const { data: settings } = await supabase
      .from('messenger_settings')
      .select('access_token')
      .eq('page_id', pageId)
      .single();

    if (!settings) {
      throw new Error('Facebook page settings not found');
    }

    // Get user profile information
    const userProfile = await fetchUserProfile(senderId, settings.access_token);
    
    // Store conversation and get AI response
    const conversationId = await storeConversation(
      supabase,
      senderId,
      userProfile.name,
      message,
      'facebook'
    );

    // Check if AI is enabled for this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('ai_enabled')
      .eq('id', conversationId)
      .single();

    if (conversation?.ai_enabled) {
      const aiResponse = await generateAIResponse(message, conversationId);
      await sendFacebookMessage(senderId, aiResponse, settings.access_token);
      
      // Store AI response in database
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        content: aiResponse,
        sender_name: 'AI Assistant',
        sender_number: 'system',
        status: 'sent',
      });
    }

  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}

async function fetchUserProfile(userId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/${userId}?fields=name&access_token=${accessToken}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  return await response.json();
}

async function sendFacebookMessage(recipientId: string, message: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send message: ${JSON.stringify(error)}`);
  }

  return await response.json();
}