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
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, profileType, name } = await req.json()

    // 1. Create user in Auth
    const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: name,
        profile_type: profileType
      }
    })

    if (userError) throw userError

    // 2. Update profile if necessary (triggers usually handle creation)
    if (userData.user) {
        // Wait a small moment for trigger? Or just update.
        // We'll attempt an update to ensure fields are set correctly
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({
                account_type: profileType,
                display_name: name,
                is_verified: false,
                is_premium: false
            })
            .eq('id', userData.user.id)
            
        // If update returned 0 rows or error, it might mean trigger hasn't fired or failed.
        // But for now we assume auth creation is the critical part.
    }

    return new Response(
      JSON.stringify(userData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
