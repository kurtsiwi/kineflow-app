import "server-only";
import { headers } from "next/headers";

/**
 * URL absoluta del sitio, para armar el enlace que se le manda al paciente.
 * Se deriva de los headers del request, que es lo único que funciona igual en
 * local, en preview y en producción sin configurar nada.
 */
export async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (host) {
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");

    return `${protocol}://${host}`;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return "http://localhost:3000";
}
