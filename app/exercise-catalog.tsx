"use client";

import { useMemo, useState } from "react";
import { formatDosage, type Exercise } from "@/lib/exercise-model";

const DIFFICULTY_STYLES: Record<string, string> = {
  principiante:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  intermedio: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  avanzado: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const ALL = "__all__";

export function ExerciseCatalog({
  exercises,
  categories,
}: {
  exercises: Exercise[];
  categories: string[];
}) {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return exercises.filter((exercise) => {
      if (category !== ALL && exercise.category !== category) {
        return false;
      }

      if (needle === "") {
        return true;
      }

      return [exercise.name, exercise.description, exercise.body_area]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [exercises, category, query]);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={category === ALL}
            onClick={() => setCategory(ALL)}
          >
            Todos
          </FilterPill>
          {categories.map((name) => (
            <FilterPill
              key={name}
              active={category === name}
              onClick={() => setCategory(name)}
            >
              {name}
            </FilterPill>
          ))}
        </div>

        <label className="sm:w-72">
          <span className="sr-only">Buscar ejercicio</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o zona…"
            className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-brand dark:border-zinc-800 dark:bg-zinc-950"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-zinc-500 dark:text-zinc-400">
          {exercises.length === 0
            ? "Todavía no hay ejercicios publicados. Agrega el primero desde el panel."
            : "Ningún ejercicio coincide con la búsqueda."}
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const dosage = formatDosage(exercise);

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-teal-100 to-emerald-50 dark:from-teal-950 dark:to-zinc-900">
        {exercise.image_url ? (
          // Las URLs las escribe el admin y pueden apuntar a cualquier host,
          // así que no pasan por el optimizador de next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.image_url}
            alt={exercise.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
            DIFFICULTY_STYLES[exercise.difficulty]
          }`}
        >
          {exercise.difficulty}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          {exercise.category ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              {exercise.category}
            </span>
          ) : null}
          <h3 className="text-lg font-semibold leading-tight">
            {exercise.name}
          </h3>
          {exercise.body_area ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {exercise.body_area}
            </p>
          ) : null}
        </div>

        {exercise.description ? (
          <p className="line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {exercise.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          {dosage ? (
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {dosage}
            </span>
          ) : (
            <span />
          )}
          {exercise.video_url ? (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand hover:underline"
            >
              Ver video →
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}
