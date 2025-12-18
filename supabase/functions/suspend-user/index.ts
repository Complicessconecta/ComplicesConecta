// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, action, reason } = await req.json() // action: 'suspend' | 'activate'

    if (action === 'suspend') {
        // Ban user in Auth (100 years)
        const { error: banError } = await supabaseClient.auth.admin.updateUserById(
            userId,
            { ban_duration: '876000h' } 
        )
        if (banError) throw banError

        // Update profile
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ 
                suspended: true,
                suspended_at: new Date().toISOString(),
                suspended_reason: reason 
            })
            .eq('id', userId)
        if (profileError) throw profileError

    } else if (action === 'activate') {
        // Unban user
        const { error: unbanError } = await supabaseClient.auth.admin.updateUserById(
            userId,
            { ban_duration: '0' }
        )
        if (unbanError) throw unbanError

        // Update profile
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ 
                suspended: false,
                suspended_at: null,
                suspended_reason: null
            })
            .eq('id', userId)
        if (profileError) throw profileError
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
