import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Kine<span className="text-brand">Flow</span>
        </Link>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Panel de administración
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Entra con la cuenta que te crearon en Supabase.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Volver al catálogo
        </Link>
      </div>
    </main>
  );
}
