import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

// Dynamic CORS based on origin
const allowedOrigins = [
  'https://automatenance.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
];
function getCorsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const reqOrigin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(reqOrigin);

  // Debug: log incoming origin/method
  console.log('ai-assistant - Request Origin:', reqOrigin, 'Method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get OpenAI API key from environment variables
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

  try {
    // Create a Supabase client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get the current user to check if they are a pro user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, allow all authenticated users as "pro"
    const isPro = true;

    if (!isPro) {
      return new Response(
        JSON.stringify({ error: 'Pro subscription required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let message, history;
    try {
      const body = await req.json();
      message = body.message;
      history = body.history ?? [];
    } catch (parseError) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if OpenAI API key is available
    if (!openAIApiKey) {
      // For demo purposes, return a mock response if no API key is set
      console.log('OPENAI_API_KEY not found. Using mock response.');

      const mockResponses = [
        "I'm a demo version of the Auto-Assist AI. To get real responses, the administrator needs to set up the OPENAI_API_KEY in the Supabase secrets.",
        "For your vehicle maintenance needs, I recommend consulting your vehicle's owner manual or a professional mechanic.",
        "This is a simulated response. The application is working correctly, but the OpenAI API key has not been configured."
      ];

      // Return a random mock response
      const randomIndex = Math.floor(Math.random() * mockResponses.length);

      return new Response(
        JSON.stringify({
          response: mockResponses[randomIndex],
          isMock: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: 'You are Auto-Assist AI, a specialized vehicle maintenance assistant. Provide helpful, accurate advice about vehicle maintenance, troubleshooting, and repairs. Be concise but thorough. If you don\'t know something, be honest about it. Always prioritize safety in your recommendations.'
      },
      ...history,
      { role: 'user', content: message }
    ];

    try {
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (_) {
          // do nothing, fallback to empty object
        }
        console.error('OpenAI API error:', errorData);

        if (response.status === 429) {
          return new Response(
            JSON.stringify({
              error: 'OpenAI quota exceeded',
              errorType: 'quota_exceeded',
              errorDetails: errorData?.error?.message || 'Quota exceeded'
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            error: `OpenAI API returned error: ${response.status}`,
            errorDetails: errorData?.error?.message ?? 'Unknown error'
          }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();

      return new Response(
        JSON.stringify({
          response: data.choices?.[0]?.message?.content ?? '[No AI response returned]',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: unknown) {
      const errorMessage =
        (error && typeof error === 'object' && 'message' in error)
          ? (error as { message: string }).message
          : 'Unknown error occurred (OpenAI)';
      console.error('Error processing OpenAI request:', error);
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage =
      (error && typeof error === 'object' && 'message' in error)
        ? (error as { message: string }).message
        : 'Unknown error occurred';
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
