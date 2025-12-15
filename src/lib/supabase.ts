import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("VITE_SUPABASE_URL =", supabaseUrl);
console.log("VITE_SUPABASE_ANON_KEY =", supabaseAnonKey?.slice(0, 12));

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL (check .env at project root and restart dev server)");
if (!supabaseAnonKey) throw new Error("Missing VITE_SUPABASE_ANON_KEY (check .env at project root and restart dev server)");

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
