import { createClient } from "@supabase/supabase-js"

// Use the actual environment variable names from your Vercel integration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// For development, create a mock client if environment variables are not set
const isDevelopment = process.env.NODE_ENV === "development"

if (isDevelopment && (!SUPABASE_URL || SUPABASE_URL === "https://placeholder.supabase.co")) {
  console.warn("Supabase environment variables not set. Using mock client for development.")
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
