/**
 * Las variables las inyecta la integración de Supabase de Vercel, con el
 * prefijo del store (`KINEFLOW_STORAGE_`). Se leen de forma perezosa para que
 * un entorno mal configurado falle con un mensaje claro en vez de romper el
 * build.
 */
export function supabaseEnv() {
  const url = process.env.KINEFLOW_STORAGE_SUPABASE_URL;
  const key =
    process.env.KINEFLOW_STORAGE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_KINEFLOW_STORAGE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de Supabase. Define KINEFLOW_STORAGE_SUPABASE_URL y " +
        "KINEFLOW_STORAGE_SUPABASE_PUBLISHABLE_KEY en .env.local.",
    );
  }

  return { url, key };
}
