import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/**
 * Refresca el token de Supabase y lo escribe en la respuesta. Es el único
 * lugar donde el refresco puede persistirse, porque al renderizar no se
 * pueden escribir cookies.
 *
 * Devuelve también los claims del JWT para hacer chequeos optimistas de
 * sesión. Se usa `getClaims()` en vez de `getUser()` porque verifica la firma
 * en local (con claves asimétricas) y el proxy corre en cada request,
 * incluidos los prefetch.
 */
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Una respuesta que setea cookies de sesión no puede cachearse en CDN.
        for (const [header, value] of Object.entries(headers)) {
          response.headers.set(header, value);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  return { response, claims: data?.claims ?? null };
}
