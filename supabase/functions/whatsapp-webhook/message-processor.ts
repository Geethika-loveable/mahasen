import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { generateAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';
import { getAISettings } from './ai-settings.ts';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getRecentConversationHistory(userId: string, aiSettings: any): Promise<string> {
  try {
    console.log('Fetching conversation history for user:', userId);
    
    // Get the conversation ID for this user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', userId)
      .single();

    if (!conversation) {
      console.log('No existing conversation found for user');
      return '';
    }

    // Fetch recent messages based on AI settings context length
    const { data: messages, error } = await supabase
      .from('messages')
      .select('content, sender_name, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: false })
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
    const ticketData = {
      title: 'Human Agent Request',
      customer_name: customerName,
      platform,
      type: analysis.detected_entities.issue_type || 'General',
      body: messageContent,
      message_id: messageId,
      conversation_id: conversationId,
      intent_type: analysis.intent,
      context,
      confidence_score: analysis.confidence,
      escalation_reason: analysis.escalation_reason,
      priority: analysis.detected_entities.urgency_level === 'high' ? 'HIGH' : 
               analysis.detected_entities.urgency_level === 'medium' ? 'MEDIUM' : 'LOW',
      status: 'New'
    };

    console.log('Creating ticket with data:', ticketData);

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }

    console.log('Ticket created successfully:', ticket);
    return ticket;
  } catch (error) {
    console.error('Error in createTicket:', error);
    throw error;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  console.log('Generating embedding for text:', text);
  try {
    const session = new Supabase.ai.Session('gte-small');
    const embedding = await session.run(text, {
      mean_pool: true,
      normalize: true,
    });
    console.log('Generated embedding successfully');
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function searchKnowledgeBase(query: string, embedding: number[]): Promise<string> {
  console.log('Searching knowledge base for:', query);
  try {
    const { data: matches, error } = await supabase.rpc('match_knowledge_base', {
      query_text: query,
      query_embedding: `[${embedding.join(',')}]`,
      match_count: 3,
      full_text_weight: 0.3,
      semantic_weight: 0.7,
      match_threshold: 0.5
    });

    if (error) {
      console.error('Error searching knowledge base:', error);
      return '';
    }

    if (!matches || matches.length === 0) {
      console.log('No matches found in knowledge base');
      return '';
    }

    console.log('Found matches:', matches);
    return matches.map(match => match.content).join('\n\n');
  } catch (error) {
    console.error('Error in knowledge base search:', error);
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
    console.log('Processing message:', {
      messageId,
      userMessage,
      userId,
      userName
    });

    // Fetch AI settings
    const aiSettings = await getAISettings();
    console.log('AI settings retrieved:', aiSettings);

    // Generate embedding for the user message
    const embedding = await generateEmbedding(userMessage);
    
    // Search knowledge base using the embedding
    const knowledgeBaseContext = await searchKnowledgeBase(userMessage, embedding);
    console.log('Knowledge base context:', knowledgeBaseContext);

    // Get conversation history using AI settings
    const conversationHistory = await getRecentConversationHistory(userId, aiSettings);
    console.log('Retrieved conversation history:', conversationHistory);

    // Combine all context
    const fullContext = `
Knowledge Base Context:
${knowledgeBaseContext}

Conversation History:
${conversationHistory}
`.trim();

    console.log('Combined context:', fullContext);

    // Generate AI response using all available context
    const aiResponse = await generateAIResponse(userMessage, fullContext, aiSettings);
    console.log('AI Response:', aiResponse);
    
    // Send response back via WhatsApp
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
    await sendWhatsAppMessage(userId, aiResponse, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);

    // Store the conversation and get the conversation ID
    const conversationId = await storeConversation(supabase, userId, userName, userMessage, aiResponse);

    // Check if we need to create a ticket
    if (
      aiResponse.requires_escalation ||
      aiResponse.intent === 'HUMAN_AGENT_REQUEST' ||
      (aiResponse.intent === 'SUPPORT_REQUEST' && aiResponse.detected_entities.urgency_level === 'high')
    ) {
      console.log('Ticket creation criteria met:', aiResponse);
      await createTicket(
        messageId,
        conversationId,
        aiResponse,
        userName,
        'whatsapp',
        userMessage,
        fullContext
      );
    }
  } catch (error) {
    console.error('Error processing message:', error);
    throw error;
  }
}