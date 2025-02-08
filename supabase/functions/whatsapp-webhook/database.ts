
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function storeConversation(supabase: any, userId: string, userName: string, userMessage: string, aiResponse: string) {
  try {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', userId)
      .single();

    if (convError && convError.code !== 'PGRST116') {
      throw convError;
    }

    let conversationId;
    if (!conversation) {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          contact_number: userId,
          contact_name: userName,
          platform: 'whatsapp'
        })
        .select()
        .single();

      if (createError) throw createError;
      conversationId = newConversation?.id;
    } else {
      conversationId = conversation.id;
    }

    // First check if messages already exist
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('content', userMessage)
      .single();

    if (!existingMessages) {
      // Only insert messages if they don't exist
      const { error: msgError } = await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          content: userMessage,
          status: 'received',
          sender_name: userName,
          sender_number: userId
        },
        {
          conversation_id: conversationId,
          content: aiResponse,
          status: 'sent',
          sender_name: 'AI Assistant',
          sender_number: 'system'
        }
      ]);

      if (msgError) throw msgError;
    }
    
    return conversationId;
  } catch (error) {
    console.error('Error storing conversation:', error);
    throw error;
  }
}
