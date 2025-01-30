import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to generate question embedding');
    
    // Extract input from request body
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      throw new Error('Input text is required and must be a string');
    }

    console.log('Initializing embedding session for question');
    const session = new Supabase.ai.Session('gte-small');

    console.log('Generating embedding for question');
    const embedding = await session.run(text, {
      mean_pool: true,
      normalize: true,
    });

    console.log('Successfully generated question embedding');

    return new Response(
      JSON.stringify({ embedding }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in generate-embedding function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to generate embedding'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});