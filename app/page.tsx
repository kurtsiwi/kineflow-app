import Link from "next/link";
import { collectCategories } from "@/lib/exercise-model";
import { listPublishedExercises } from "@/lib/exercises";
import { ExerciseCatalog } from "./exercise-catalog";

export default async function Home() {
  // Lectura cacheada: el catálogo entra completo en el shell estático.
  const exercises = await listPublishedExercises();
  const categories = collectCategories(exercises);

  return (
    <>
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Kine<span className="text-brand">Flow</span>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Panel
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">
            Catálogo de ejercicios
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Ejercicios de kinesiología, con su dosificación clara.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Series, repeticiones, zona del cuerpo y material de apoyo para cada
            ejercicio del programa.
          </p>
          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Ejercicios
              </dt>
              <dd className="text-2xl font-semibold">{exercises.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                Categorías
              </dt>
              <dd className="text-2xl font-semibold">{categories.length}</dd>
            </div>
          </dl>
        </section>

        <ExerciseCatalog exercises={exercises} categories={categories} />
      </main>

      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <p className="mx-auto w-full max-w-6xl px-6 text-sm text-zinc-500 dark:text-zinc-400">
          KineFlow · Información orientativa. No reemplaza la indicación de un
          profesional.
        </p>
      </footer>
    </>
  );
}
