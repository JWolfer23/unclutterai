import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple XOR-based encryption (same as callback)
const ENCRYPTION_KEY = Deno.env.get("TOKEN_ENCRYPTION_KEY") || "default-key-change-in-production";

function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encoded: string, key: string): string {
  const text = atob(encoded);
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const { credentialId } = await req.json();

    if (!credentialId) {
      throw new Error("Missing credentialId");
    }

    // Fetch the credential
    const { data: credential, error: fetchError } = await supabase
      .from("email_credentials")
      .select("*")
      .eq("id", credentialId)
      .eq("user_id", user.id)
      .eq("provider", "microsoft")
      .single();

    if (fetchError || !credential) {
      throw new Error("Credential not found");
    }

    // Decrypt the refresh token
    const refreshToken = xorDecrypt(credential.refresh_token_encrypted, ENCRYPTION_KEY);

    // Exchange refresh token for new access token
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Microsoft OAuth not configured");
    }

    console.log("Refreshing Microsoft token for credential:", credentialId);

    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "openid profile email Mail.Read Calendars.ReadWrite offline_access",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error("Token refresh failed:", tokenData.error, tokenData.error_description);
      
      // Check if token was revoked or is invalid
      if (tokenData.error === "invalid_grant" || 
          tokenData.error === "interaction_required" ||
          tokenData.error_description?.includes("revoked") ||
          tokenData.error_description?.includes("expired")) {
        
        // Mark credential as inactive due to revocation
        await supabase
          .from("email_credentials")
          .update({
            is_active: false,
            sync_error: `Token revoked or expired: ${tokenData.error_description || tokenData.error}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", credentialId);

        return new Response(
          JSON.stringify({
            success: false,
            revoked: true,
            error: "Token has been revoked or expired. Please reconnect your Microsoft account.",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(tokenData.error_description || "Failed to refresh token");
    }

    // Calculate new expiration time
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Encrypt new tokens
    const encryptedAccessToken = xorEncrypt(tokenData.access_token, ENCRYPTION_KEY);
    const encryptedRefreshToken = tokenData.refresh_token 
      ? xorEncrypt(tokenData.refresh_token, ENCRYPTION_KEY)
      : credential.refresh_token_encrypted; // Keep old refresh token if not returned

    // Update credential with new tokens
    const { error: updateError } = await supabase
      .from("email_credentials")
      .update({
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: expiresAt,
        sync_error: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", credentialId);

    if (updateError) {
      console.error("Failed to update credential:", updateError);
      throw new Error("Failed to store refreshed tokens");
    }

    console.log("Successfully refreshed Microsoft token, expires at:", expiresAt);

    return new Response(
      JSON.stringify({
        success: true,
        expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Microsoft token refresh error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
