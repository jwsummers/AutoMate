
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get Stripe API key from environment variables
  const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  try {
    // Create a Supabase client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the current user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const user = userData.user;

    // Check if Stripe API key is available
    if (!stripeApiKey) {
      // For development, set a default subscription tier
      return new Response(
        JSON.stringify({ 
          subscribed: true,
          plan: 'free',
          vehicles_limit: 1,
          maintenance_limit: 25,
          ai_access: false,
          ai_predictions: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeApiKey, {
      apiVersion: '2023-10-16',
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      // No customer found, return free plan
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          plan: 'free',
          vehicles_limit: 1,
          maintenance_limit: 25,
          ai_access: false,
          ai_predictions: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerId = customers.data[0].id;
    
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price.product']
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, return free plan
      return new Response(
        JSON.stringify({ 
          subscribed: false,
          plan: 'free',
          vehicles_limit: 1,
          maintenance_limit: 25,
          ai_access: false,
          ai_predictions: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    
    // Determine plan based on price ID
    let plan = 'free';
    let vehicles_limit = 1;
    let maintenance_limit = 25;
    let ai_access = false;
    let ai_predictions = false;
    
    // These price IDs should be replaced with actual price IDs from your Stripe dashboard
    if (priceId === 'price_pro') {
      plan = 'pro';
      vehicles_limit = 5;
      maintenance_limit = 500;
      ai_access = true;
      ai_predictions = true;
    } else if (priceId === 'price_premium') {
      plan = 'premium';
      vehicles_limit = -1; // Unlimited
      maintenance_limit = -1; // Unlimited
      ai_access = true;
      ai_predictions = true;
    }

    // Update the user's subscription in the database
    await supabaseClient.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      plan,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    return new Response(
      JSON.stringify({ 
        subscribed: true,
        plan,
        vehicles_limit,
        maintenance_limit,
        ai_access,
        ai_predictions,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to check subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
