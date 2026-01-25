// Edge Function para crear Payment Intent de Stripe con comisiones
// Fase 3: Lógica de Cobro y Comisiones

import { serve } from "std/http/server.ts"
import Stripe from "stripe"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

serve(async (req: Request) => {
  try {
    const { clubId, userId, amount, clubTier } = await req.json()

    // Validar parámetros
    if (!clubId || !userId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // LÓGICA DE NEGOCIO: 20% si es Free, 0% si es Premium
    const commissionPercentage = clubTier === 'premium' ? 0 : 0.20
    const applicationFee = Math.round(amount * commissionPercentage)

    // Obtener cuenta Stripe del club
    const { data: club, error: clubError } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/clubs?id=eq.${clubId}&select=stripe_account_id`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      }
    ).then(res => res.json())

    if (clubError || !club || !club[0]?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: 'Club not found or no Stripe account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const stripeAccountId = club[0].stripe_account_id

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method_types: ['card'],
      // Aquí se define la transferencia al club menos la comisión
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: stripeAccountId,
      },
      metadata: {
        club_id: clubId,
        user_id: userId,
        tier: clubTier,
        type: 'reservation',
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        applicationFee,
        commissionPercentage,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating payment intent:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
