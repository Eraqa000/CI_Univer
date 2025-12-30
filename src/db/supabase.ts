import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error("Supabase env missing");
}

// Log masked preview so we can verify which key is loaded on startup
try {
  const preview = serviceKey ? `${serviceKey.slice(0, 8)}...${serviceKey.slice(-8)}` : null;
  console.log('Supabase client init:', { url, serviceKeyPreview: preview });
} catch (e) {
  // ignore logging errors
}

export const supabase = createClient(url, serviceKey);
