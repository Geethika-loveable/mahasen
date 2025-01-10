import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { processMessage } from "./message-processor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const VERIFY_TOKEN = Deno.env.get('MESSENGER_VERIFY_TOKEN');
  
  // Handle webhook verification from Facebook
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    console.log('Received verification request:', { mode, token, challenge });

    if (!mode || !token) {
      console.error('Missing mode or token');
      return new Response('Missing parameters', { 
        status: 400,
        headers: { ...corsHeaders }
      });
    }

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      // Important: Return challenge as plain text, not JSON
      return new Response(challenge, {
        status: 200,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/plain'
        }
      });
    }

    console.error('Verification failed - Invalid verify token');
    return new Response('Verification failed', {
      status: 403,
      headers: { ...corsHeaders }
    });
  }

  // Handle incoming webhook events
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received webhook event:', JSON.stringify(body, null, 2));

      // Verify this is a page webhook
      if (body.object === 'page') {
        for (const entry of body.entry) {
          // Handle each messaging event
          if (entry.messaging) {
            for (const event of entry.messaging) {
              if (event.message) {
                await processMessage(event);
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { 
    status: 405,
    headers: corsHeaders 
  });
});