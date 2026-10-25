import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Cliente sin sesión, para el catálogo público. No toca `cookies()`, así que
 * se puede usar dentro de un scope `"use cache"` y entrar en el shell
 * estático. RLS lo deja ver solo los ejercicios publicados.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
