import "server-only";
import { cacheLife } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export type AdminUser = {
  id: string;
  email: string;
};

/**
 * Lectura directa de la sesión, sin cache. Es la que vale para autorizar:
 * úsala en Server Actions y Route Handlers, nunca confíes en el cliente.
 */
export async function getSessionUser(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return { id: data.user.id, email: data.user.email ?? "" };
}

/**
 * Igual que `getSessionUser`, pero cacheada por sesión en el navegador. Es
 * para renderizar UI: permite prefetchear el panel sin volver a leer la
 * sesión en cada componente. Lee `cookies()`, así que quien la llame tiene que
 * estar detrás de un `<Suspense>`.
 */
export async function getCurrentUser(): Promise<AdminUser | null> {
  "use cache: private";
  cacheLife("minutes");

  return getSessionUser();
}

/** Exige sesión y, si no hay, manda al login. Para Server Actions. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
