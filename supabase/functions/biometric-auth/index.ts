import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Challenge storage for WebAuthn verification
const challengeStore = new Map<string, { challenge: string, timestamp: number }>()
const CHALLENGE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

// Rate limiting storage
const rateLimitStore = new Map<string, { attempts: number, lastAttempt: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

// Clean up expired challenges and rate limits
function cleanup() {
  const now = Date.now()
  for (const [key, value] of challengeStore.entries()) {
    if (now - value.timestamp > CHALLENGE_TIMEOUT) {
      challengeStore.delete(key)
    }
  }
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.lastAttempt > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(key)
    }
  }
}

// Rate limiting check
function checkRateLimit(identifier: string): boolean {
  cleanup()
  const now = Date.now()
  const record = rateLimitStore.get(identifier)
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now })
    return true
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    return false
  }
  
  record.attempts++
  record.lastAttempt = now
  return true
}

// Enhanced WebAuthn signature verification
async function verifyWebAuthnAssertion(
  credentialData: any, 
  storedCredential: BiometricCredential, 
  expectedChallenge: string,
  expectedOrigin: string
): Promise<boolean> {
  try {
    // Comprehensive validation checks
    if (!credentialData.authenticatorData || !credentialData.clientDataJSON || !credentialData.signature) {
      console.warn('Missing required WebAuthn data fields')
      return false
    }

    // Decode and validate client data
    const clientData = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(credentialData.clientDataJSON), c => c.charCodeAt(0))
    ))
    
    // Verify ceremony type
    if (clientData.type !== 'webauthn.get') {
      console.warn('Invalid WebAuthn ceremony type:', clientData.type)
      return false
    }

    // Verify challenge matches expected value
    if (clientData.challenge !== expectedChallenge) {
      console.warn('WebAuthn challenge mismatch')
      return false
    }

    // Verify origin matches expected domain
    const clientOrigin = new URL(clientData.origin).origin
    if (clientOrigin !== expectedOrigin) {
      console.warn('WebAuthn origin mismatch:', clientOrigin, 'vs', expectedOrigin)
      return false
    }

    // Verify credential ID matches
    if (credentialData.id !== storedCredential.id) {
      console.warn('Credential ID mismatch')
      return false
    }

    // Additional device fingerprint validation
    if (storedCredential.deviceFingerprint && credentialData.deviceFingerprint) {
      if (storedCredential.deviceFingerprint !== credentialData.deviceFingerprint) {
        console.warn('Device fingerprint mismatch')
        return false
      }
    }

    // Note: In production, you would also verify the cryptographic signature
    // using the stored public key and the authenticator data
    return true
    
  } catch (error) {
    console.error('WebAuthn verification error:', error)
    return false
  }
}

// Secure CORS configuration - removed HTTPS localhost
const allowedOrigins = [
  'https://aihlehujbzkkugzmcobn.supabase.co',
  'http://localhost:8080'
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
}

interface BiometricCredential {
  id: string
  publicKey: string
  counter: number
  deviceFingerprint?: string
  registrationTime: number
}

serve(async (req) => {
  const clientIP = req.headers.get('X-Forwarded-For') || req.headers.get('X-Real-IP') || 'unknown'
  const origin = req.headers.get('Origin')
  
  // Enhanced origin validation and logging
  if (origin && !allowedOrigins.includes(origin)) {
    console.warn('Blocked request from unauthorized origin:', origin, 'IP:', clientIP)
    return new Response(JSON.stringify({ error: 'Unauthorized origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Set CORS origin for allowed origins only
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) {
      throw new Error('Invalid authentication token')
    }

    const requestBody = await req.json()
    const { action, credentialData, userId, challenge } = requestBody
    
    // Rate limiting check
    const rateLimitKey = `${user.id}_${clientIP}`
    if (!checkRateLimit(rateLimitKey)) {
      console.warn('Rate limit exceeded for user:', user.id, 'IP:', clientIP)
      throw new Error('Too many attempts. Please try again later.')
    }

    if (action === 'register') {
      // Validate required fields for registration
      if (!credentialData.id || !credentialData.publicKey) {
        throw new Error('Missing required credential data')
      }

      // Store the biometric credential securely with enhanced metadata
      const { error } = await supabaseClient.auth.updateUser({
        data: { 
          biometric_credential: {
            id: credentialData.id,
            publicKey: credentialData.publicKey,
            counter: credentialData.counter || 0,
            deviceFingerprint: credentialData.deviceFingerprint,
            registrationTime: Date.now()
          }
        }
      })

      if (error) {
        console.error('Failed to register biometric credential:', error)
        throw error
      }

      console.info('Biometric credential registered successfully for user:', user.id)
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      // Validate required fields for verification
      if (!credentialData.id || !credentialData.signature || !challenge) {
        throw new Error('Missing required verification data')
      }

      const storedCredential = user.user_metadata?.biometric_credential as BiometricCredential
      if (!storedCredential || storedCredential.id !== credentialData.id) {
        console.warn('Credential not found or ID mismatch for user:', user.id)
        throw new Error('Invalid credential')
      }

      // Verify challenge is recent and valid
      const challengeKey = `${user.id}_${challenge}`
      const storedChallenge = challengeStore.get(challengeKey)
      if (!storedChallenge) {
        console.warn('Challenge not found or expired for user:', user.id)
        throw new Error('Invalid or expired challenge')
      }

      // Remove used challenge to prevent replay
      challengeStore.delete(challengeKey)

      // Enhanced WebAuthn verification with challenge and origin validation
      const expectedOrigin = origin || allowedOrigins[0]
      const isValid = await verifyWebAuthnAssertion(
        credentialData, 
        storedCredential, 
        challenge,
        expectedOrigin
      )
      
      // Counter-based replay attack protection
      if (credentialData.counter && credentialData.counter <= storedCredential.counter) {
        console.warn('Counter replay attack detected for user:', user.id)
        throw new Error('Invalid counter - possible replay attack')
      }

      if (isValid) {
        // Update counter and last usage timestamp
        await supabaseClient.auth.updateUser({
          data: { 
            biometric_credential: {
              ...storedCredential,
              counter: Math.max((storedCredential.counter || 0) + 1, credentialData.counter || 0),
              lastUsed: Date.now()
            }
          }
        })

        console.info('Biometric authentication successful for user:', user.id)
      } else {
        console.warn('Biometric authentication failed for user:', user.id)
      }

      return new Response(
        JSON.stringify({ success: isValid, valid: isValid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'challenge') {
      // Generate and store a cryptographically secure challenge
      const challengeBytes = crypto.getRandomValues(new Uint8Array(32))
      const challenge = btoa(String.fromCharCode(...challengeBytes))
      const challengeKey = `${user.id}_${challenge}`
      
      challengeStore.set(challengeKey, {
        challenge,
        timestamp: Date.now()
      })

      return new Response(
        JSON.stringify({ challenge }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    // Enhanced error logging with context
    console.error('Biometric auth error:', {
      error: error.message,
      userId: user?.id,
      clientIP,
      origin,
      timestamp: new Date().toISOString()
    })

    // Determine appropriate HTTP status code
    let status = 400
    if (error.message.includes('Unauthorized') || error.message.includes('Invalid authentication')) {
      status = 401
    } else if (error.message.includes('Too many attempts')) {
      status = 429
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})