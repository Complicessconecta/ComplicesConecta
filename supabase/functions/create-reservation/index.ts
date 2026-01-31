import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
  try {
    const { clubId, userId, amount, currency, paymentMethod, accessType, reservedAt } = await req.json()

    if (!clubId || !userId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Solo el propietario del perfil puede reservar' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, membership_tier, metadata')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return new Response(
        JSON.stringify({ error: 'Club not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const reservationConfig = club.metadata?.reservation_config || {}
    const allowsReservations = reservationConfig.allows_reservations !== false

    if (!allowsReservations) {
      return new Response(
        JSON.stringify({ error: 'Este club no permite reservaciones' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (reservationConfig.requires_exact_datetime && !reservedAt) {
      return new Response(
        JSON.stringify({ error: 'Este club requiere fecha y hora exacta' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (reservationConfig.exact_datetime && reservedAt) {
      const exactDatetime = new Date(reservationConfig.exact_datetime)
      const requestedAt = new Date(reservedAt)

      if (exactDatetime.getTime() !== requestedAt.getTime()) {
        return new Response(
          JSON.stringify({ error: 'Solo se permite reservar en la fecha y hora exacta definida por el club' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const tier: 'free' | 'premium' = club.membership_tier === 'premium' ? 'premium' : 'free'
    const commissionAmount = tier === 'free' ? amount * 0.2 : 0
    const qrHash = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        club_id: clubId,
        user_id: userId,
        qr_hash: qrHash,
        amount,
        currency: currency || 'usd',
        payment_method: paymentMethod || 'stripe',
        access_type: accessType || 'general',
        status: 'pending',
        commission_amount: commissionAmount,
        commission_paid: false,
        reserved_at: reservedAt || null,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ reservation }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating reservation:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
