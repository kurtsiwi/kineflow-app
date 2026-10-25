import "server-only";
import { io } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Cliente ligado a las cookies del request: es el que conoce la sesión. Como
 * lee `cookies()`, quien lo use tiene que estar detrás de un `<Suspense>`
 * (ver app/getting-started/caching) o ser una Server Action.
 *
 * El `io()` es necesario porque auth-js valida la expiración del token contra
 * `Date.now()`, y lo hace antes de leer la cookie. Sin esto, el prerender ve
 * un valor inestable y la ruta se marca como bloqueante. `io()` suspende solo
 * durante el prerender: en un request real y dentro de un scope cacheado
 * resuelve de inmediato, así que no rompe `getCurrentUser()`.
 */
export async function createSupabaseServerClient() {
  await io();

  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Al renderizar no se pueden escribir cookies. El refresco de tokens
          // lo hace proxy.ts, que sí puede.
        }
      },
    },
  });
}
