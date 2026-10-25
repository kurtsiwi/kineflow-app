import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { signOut } from "./actions";

const NAV = [
  { href: "/admin", label: "Seguimiento" },
  { href: "/admin/pacientes", label: "Pacientes" },
  { href: "/admin/ejercicios", label: "Ejercicios" },
] as const;

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-5">
          <Link href="/admin" className="font-semibold tracking-tight">
            Kine<span className="text-brand">Flow</span>
            <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
              panel
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
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

        <nav className="mx-auto flex w-full max-w-6xl gap-6 px-6 pt-4 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b-2 border-transparent pb-3 font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-foreground dark:text-zinc-400 dark:hover:border-zinc-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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

  return <span className="text-zinc-500 dark:text-zinc-400">{user.email}</span>;
}
