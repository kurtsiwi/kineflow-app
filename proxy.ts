import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, claims } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  // Chequeo optimista: evita renderizar el panel a quien no tiene sesión. La
  // autorización de verdad la hacen RLS y los chequeos de cada Server Action.
  if (pathname.startsWith("/admin") && !claims) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && claims) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Todas las rutas menos los assets estáticos, para que el token se
    // refresque en cualquier navegación.
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
