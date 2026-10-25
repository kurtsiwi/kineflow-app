import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { formatDosage } from "@/lib/exercise-model";
import { listAllExercises } from "@/lib/exercises";
import { togglePublished } from "./actions";
import { DeleteExerciseButton } from "./delete-exercise-button";

export const metadata: Metadata = {
  title: "Ejercicios",
};

export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Solo los ejercicios publicados aparecen en el home.
          </p>
        </div>

        <Link
          href="/admin/ejercicios/nuevo"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nuevo ejercicio
        </Link>
      </div>

      {/* La tabla lee la sesión del request: entra detrás del boundary. */}
      <Suspense fallback={<TableSkeleton />}>
        <ExercisesTable />
      </Suspense>
    </div>
  );
}

async function ExercisesTable() {
  await requireUser();
  const exercises = await listAllExercises();

  if (exercises.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Todavía no hay ejercicios. Crea el primero.
      </p>
    );
  }

  return (
    <ul className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {exercises.map((exercise) => {
        const dosage = formatDosage(exercise);

        return (
          <li
            key={exercise.id}
            className="flex flex-wrap items-center gap-4 px-5 py-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{exercise.name}</span>
                {exercise.published ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Publicado
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    Borrador
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                {[exercise.category, exercise.body_area, exercise.difficulty, dosage]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <form action={togglePublished}>
                <input type="hidden" name="id" value={exercise.id} />
                <input
                  type="hidden"
                  name="published"
                  value={exercise.published ? "false" : "true"}
                />
                <button
                  type="submit"
                  className="text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
                >
                  {exercise.published ? "Despublicar" : "Publicar"}
                </button>
              </form>

              <Link
                href={`/admin/ejercicios/${exercise.id}`}
                className="text-sm font-medium text-brand hover:underline"
              >
                Editar
              </Link>

              <DeleteExerciseButton id={exercise.id} name={exercise.name} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TableSkeleton() {
  return (
    <div
      aria-hidden
      className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
    >
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex flex-col gap-2 px-5 py-5">
          <div className="h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-72 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}
