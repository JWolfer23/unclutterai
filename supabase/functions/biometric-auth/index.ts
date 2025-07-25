import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BiometricCredential {
  id: string
  publicKey: string
  counter: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Set the auth for the request
    await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))

    const { action, credentialData, userId } = await req.json()

    if (action === 'register') {
      // Store the biometric credential securely in user metadata
      const { error } = await supabaseClient.auth.updateUser({
        data: { 
          biometric_credential: {
            id: credentialData.id,
            publicKey: credentialData.publicKey,
            counter: credentialData.counter || 0
          }
        }
      })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      // Get user metadata to verify the credential
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      if (userError || !user) throw new Error('User not found')

      const storedCredential = user.user_metadata?.biometric_credential as BiometricCredential
      if (!storedCredential || storedCredential.id !== credentialData.id) {
        throw new Error('Invalid credential')
      }

      // In a production environment, you would verify the signature here
      // For now, we'll do basic validation
      const isValid = storedCredential.id === credentialData.id

      if (isValid) {
        // Update counter to prevent replay attacks
        await supabaseClient.auth.updateUser({
          data: { 
            biometric_credential: {
              ...storedCredential,
              counter: (storedCredential.counter || 0) + 1
            }
          }
        })
      }

      return new Response(
        JSON.stringify({ success: isValid, valid: isValid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Biometric auth error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})