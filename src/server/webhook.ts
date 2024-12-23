import express from 'express';
import { supabase } from '../integrations/supabase/client';
import whatsappService from '../services/whatsapp';
import ollamaService from '../services/ollama';

const router = express.Router();

interface VerificationQuery {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

// Webhook verification endpoint
router.get('/', (req, res) => {
  console.log('Received webhook verification request:', req.query);
  const query = req.query as VerificationQuery;
  
  const verifyToken = process.env.VITE_WHATSAPP_VERIFY_TOKEN;
  console.log('Comparing tokens:', {
    received: query['hub.verify_token'],
    expected: verifyToken
  });
  
  if (
    query['hub.mode'] === 'subscribe' &&
    query['hub.verify_token'] === verifyToken
  ) {
    console.log('Webhook verified successfully');
    res.status(200).send(query['hub.challenge']);
  } else {
    console.error('Webhook verification failed');
    res.sendStatus(403);
  }
});

// Message handling endpoint
router.post('/', async (req, res) => {
  console.log('Received webhook POST request:', {
    body: req.body,
    headers: req.headers
  });

  try {
    const { entry } = req.body;
    if (!entry || !Array.isArray(entry) || entry.length === 0) {
      console.error('Invalid webhook payload - missing entry array');
      return res.sendStatus(400);
    }

    const change = entry[0].changes[0];
    if (!change?.value?.contacts || !change?.value?.messages) {
      console.error('Invalid webhook payload - missing contacts or messages');
      return res.sendStatus(400);
    }

    const { contacts, messages } = change.value;
    const contact = contacts[0];
    const message = messages[0];
    const wa_id = contact.wa_id;
    const name = contact.profile.name;
    const content = message.text.body;

    console.log('Processing message:', {
      wa_id,
      name,
      content
    });

    // Store message in Supabase
    console.log('Checking for existing conversation');
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact_number', wa_id)
      .single();

    if (conversationError) {
      console.error('Error fetching conversation:', conversationError);
    }

    let conversationId = conversationData?.id;

    if (!conversationId) {
      console.log('Creating new conversation');
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          platform: 'whatsapp',
          contact_name: name,
          contact_number: wa_id
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating conversation:', createError);
        return res.sendStatus(500);
      }
      
      conversationId = newConversation?.id;
    }

    console.log('Storing incoming message');
    const { error: messageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      content,
      status: 'received',
      sender_name: name,
      sender_number: wa_id
    });

    if (messageError) {
      console.error('Error storing message:', messageError);
      return res.sendStatus(500);
    }

    // Get message history
    console.log('Fetching message history');
    const { data: messageHistory, error: historyError } = await supabase
      .from('messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      return res.sendStatus(500);
    }

    const context = {
      wa_id,
      name,
      messageHistory: messageHistory?.map(msg => msg.content) || []
    };

    // Generate and send response
    console.log('Generating Ollama response');
    const response = await ollamaService.generateResponse(context);
    
    console.log('Sending WhatsApp response');
    await whatsappService.sendMessage(wa_id, response);

    // Store bot response in Supabase
    console.log('Storing bot response');
    const { error: botMessageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: response,
      status: 'sent',
      sender_name: 'Bot',
      sender_number: 'system'
    });

    if (botMessageError) {
      console.error('Error storing bot response:', botMessageError);
      return res.sendStatus(500);
    }

    console.log('Webhook processing completed successfully');
    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.sendStatus(500);
  }
});

export default router;
