import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Stripe } from 'npm:stripe@13.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const formData = await req.text();
    const params = new URLSearchParams(formData);
    const serviceId = params.get('serviceId');

    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    // Service prices mapping
    const servicePrices = {
      'website-design': {
        price: 100,
        name: 'Website Design Package'
      },
      'website-redesign': {
        price: 50,
        name: 'Existing Website Redesign'
      },
      'hosting-support': {
        price: 20,
        name: 'Hosting/Database Support'
      },
      'multiple-social-takeover': {
        price: 100,
        name: 'Multiple Social Media Accounts Takeover'
      },
      'individual-social-takeover': {
        price: 50,
        name: 'Individual Social Media Account Takeover'
      },
      'social-content': {
        price: 20,
        name: 'Social Media Content and Guidance'
      }
    };

    const service = servicePrices[serviceId];
    if (!service) {
      throw new Error('Invalid service ID');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service.name,
            },
            unit_amount: service.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}?canceled=true`,
    });

    // Return session ID as URL-encoded response
    const response = new URLSearchParams();
    response.set('sessionId', session.id);
    
    return new Response(response.toString(), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const errorResponse = new URLSearchParams();
    errorResponse.set('error', error.message);
    
    return new Response(errorResponse.toString(), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      status: 400,
    });
  }
});