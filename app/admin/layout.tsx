import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/admin" className="font-semibold tracking-tight">
            Kine<span className="text-brand">Flow</span>
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              panel
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-zinc-500 hover:underline dark:text-zinc-400"
            >
              Ver catálogo
            </Link>

            {/* La sesión se lee en el request, así que no bloquea el shell. */}
            <Suspense fallback={null}>
              <CurrentUserEmail />
            </Suspense>

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-zinc-200 px-3 py-1.5 font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </>
  );
}

async function CurrentUserEmail() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <span className="text-zinc-500 dark:text-zinc-400">{user.email}</span>
  );
}
