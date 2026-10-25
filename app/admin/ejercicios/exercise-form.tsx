"use client";

import Link from "next/link";
import { useActionState } from "react";
import { DIFFICULTIES, type Exercise } from "@/lib/exercise-model";
import type { ExerciseFormState } from "../actions";

const INITIAL_STATE: ExerciseFormState = { error: null };

const FIELD =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand dark:border-zinc-800 dark:bg-zinc-950";

export function ExerciseForm({
  action,
  exercise,
  submitLabel,
}: {
  action: (
    state: ExerciseFormState,
    formData: FormData,
  ) => Promise<ExerciseFormState>;
  exercise?: Exercise;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-6">
      {exercise ? <input type="hidden" name="id" value={exercise.id} /> : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nombre" hint="Obligatorio, mínimo 3 caracteres.">
          <input
            name="name"
            required
            minLength={3}
            defaultValue={exercise?.name ?? ""}
            className={FIELD}
          />
        </Field>

        <Field label="Enlace (slug)" hint="Si lo dejas vacío se genera del nombre.">
          <input
            name="slug"
            defaultValue={exercise?.slug ?? ""}
            placeholder="puente-de-gluteo"
            className={FIELD}
          />
        </Field>

        <Field label="Categoría">
          <input
            name="category"
            defaultValue={exercise?.category ?? ""}
            placeholder="Fortalecimiento"
            className={FIELD}
          />
        </Field>

        <Field label="Zona del cuerpo">
          <input
            name="body_area"
            defaultValue={exercise?.body_area ?? ""}
            placeholder="Cadera y glúteos"
            className={FIELD}
          />
        </Field>

        <Field label="Dificultad">
          <select
            name="difficulty"
            defaultValue={exercise?.difficulty ?? "principiante"}
            className={`${FIELD} capitalize`}
          >
            {DIFFICULTIES.map((level) => (
              <option key={level} value={level} className="capitalize">
                {level}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Series">
            <input
              name="sets"
              type="number"
              min={1}
              defaultValue={exercise?.sets ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Reps">
            <input
              name="reps"
              type="number"
              min={1}
              defaultValue={exercise?.reps ?? ""}
              className={FIELD}
            />
          </Field>
          <Field label="Segundos">
            <input
              name="duration_seconds"
              type="number"
              min={1}
              defaultValue={exercise?.duration_seconds ?? ""}
              className={FIELD}
            />
          </Field>
        </div>

        <Field label="URL de imagen">
          <input
            name="image_url"
            type="url"
            defaultValue={exercise?.image_url ?? ""}
            placeholder="https://…"
            className={FIELD}
          />
        </Field>

        <Field label="URL de video">
          <input
            name="video_url"
            type="url"
            defaultValue={exercise?.video_url ?? ""}
            placeholder="https://youtube.com/…"
            className={FIELD}
          />
        </Field>
      </div>

      <Field label="Descripción" hint="Cómo se ejecuta el ejercicio.">
        <textarea
          name="description"
          rows={6}
          defaultValue={exercise?.description ?? ""}
          className={FIELD}
        />
      </Field>

      <label className="flex items-center gap-3 text-sm">
        <input
          name="published"
          type="checkbox"
          defaultChecked={exercise?.published ?? false}
          className="size-4 accent-teal-600"
        />
        <span>Publicado (visible en el home)</span>
      </label>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Guardando…" : submitLabel}
        </button>
        <Link
          href="/admin"
          className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}
