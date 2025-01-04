import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getAIResponse } from './ollama.ts';
import { sendWhatsAppMessage } from './whatsapp.ts';
import { storeConversation } from './database.ts';

const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!;
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')!;
const OLLAMA_BASE_URL = Deno.env.get('OLLAMA_BASE_URL')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, type, useAI = true, context = '' } = await req.json();

    if (!to || !message) {
      throw new Error('Missing required parameters');
    }

    console.log('Received request:', { to, message, type, useAI, context });

    let finalMessage = message;

    if (useAI) {
      // Get current AI model from settings
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: settings, error: settingsError } = await supabase
        .from('ai_settings')
        .select('model_name')
        .single();

      if (settingsError) {
        throw settingsError;
      }

      const currentModel = settings?.model_name || 'llama3.2:latest';
      console.log('Using AI model:', currentModel);

      finalMessage = await getAIResponse(message, currentModel, OLLAMA_BASE_URL, GEMINI_API_KEY, context);
      console.log('AI Response:', finalMessage);
    }

    // Send message to WhatsApp
    const whatsappData = await sendWhatsAppMessage(to, finalMessage, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID);
    console.log('WhatsApp API response:', whatsappData);

    return new Response(
      JSON.stringify({ success: true, data: whatsappData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});