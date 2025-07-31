import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Security headers
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Enhanced Content Security Policy with comprehensive security
      'Content-Security-Policy': mode === 'development' 
        ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' wss: ws: https://supabase.com https://*.supabase.co https://api.openai.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:;"
        : "default-src 'self'; script-src 'self' 'nonce-' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://supabase.com https://*.supabase.co https://api.openai.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; worker-src 'self' blob:; upgrade-insecure-requests; require-trusted-types-for 'script';",
      // Additional security headers for production
      ...(mode === 'production' && {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Permitted-Cross-Domain-Policies': 'none'
      })
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
