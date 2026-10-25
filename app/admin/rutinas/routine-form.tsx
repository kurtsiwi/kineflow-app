"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Exercise } from "@/lib/exercise-model";
import type { Patient } from "@/lib/patient-model";
import { createRoutineAction, type RoutineFormState } from "./actions";

const INITIAL_STATE: RoutineFormState = { error: null };

const FIELD =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand dark:border-zinc-800 dark:bg-zinc-950";

type Row = {
  key: number;
  exerciseId: string;
  sets: string;
  reps: string;
  duration: string;
  notes: string;
};

export function RoutineForm({
  patients,
  exercises,
  defaultPatientId,
}: {
  patients: Patient[];
  exercises: Exercise[];
  defaultPatientId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createRoutineAction,
    INITIAL_STATE,
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [picked, setPicked] = useState("");

  function addRow() {
    const exercise = exercises.find((item) => item.id === picked);

    if (!exercise) {
      return;
    }

    setRows((current) => [
      ...current,
      {
        key: nextKey,
        exerciseId: exercise.id,
        // Arranca con la dosificación del ejercicio base, editable por rutina.
        sets: exercise.sets?.toString() ?? "",
        reps: exercise.reps?.toString() ?? "",
        duration: exercise.duration_seconds?.toString() ?? "",
        notes: "",
      },
    ]);
    setNextKey((key) => key + 1);
    setPicked("");
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: number) {
    setRows((current) => current.filter((row) => row.key !== key));
  }

  function moveRow(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= rows.length) {
      return;
    }

    setRows((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Paciente</span>
          <select
            name="patient_id"
            required
            defaultValue={defaultPatientId ?? ""}
            className={FIELD}
          >
            <option value="">Elegir…</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.code}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Se elige por alias, no por nombre.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Título</span>
          <input
            name="title"
            required
            minLength={3}
            placeholder="Semana 1 — hombro derecho"
            className={FIELD}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Desde</span>
          <input name="starts_on" type="date" className={FIELD} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Hasta</span>
          <input name="ends_on" type="date" className={FIELD} />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Indicaciones generales</span>
        <textarea
          name="notes"
          rows={3}
          placeholder="Hacer una vez al día, detener si hay dolor agudo."
          className={FIELD}
        />
      </label>

      <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="font-medium">Ejercicios de la rutina</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          El orden es el que verá el paciente. Deja un campo vacío para usar la
          dosificación del ejercicio.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <select
            value={picked}
            onChange={(event) => setPicked(event.target.value)}
            className={`${FIELD} flex-1`}
            aria-label="Ejercicio a agregar"
          >
            <option value="">Agregar ejercicio…</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
                {exercise.body_area ? ` — ${exercise.body_area}` : ""}
                {exercise.published ? "" : " (borrador)"}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={addRow}
            disabled={picked === ""}
            className="rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Agregar
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Sin ejercicios todavía.
          </p>
        ) : (
          <ol className="mt-6 flex flex-col gap-4">
            {rows.map((row, index) => {
              const exercise = exercises.find(
                (item) => item.id === row.exerciseId,
              );

              return (
                <li
                  key={row.key}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <input
                    type="hidden"
                    name="item_exercise_id"
                    value={row.exerciseId}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {index + 1}. {exercise?.name ?? "Ejercicio"}
                    </span>

                    <div className="flex items-center gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => moveRow(index, -1)}
                        disabled={index === 0}
                        className="text-zinc-500 hover:underline disabled:opacity-40 dark:text-zinc-400"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        onClick={() => moveRow(index, 1)}
                        disabled={index === rows.length - 1}
                        className="text-zinc-500 hover:underline disabled:opacity-40 dark:text-zinc-400"
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="font-medium text-rose-600 hover:underline dark:text-rose-400"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium">Series</span>
                      <input
                        name="item_sets"
                        type="number"
                        min={1}
                        value={row.sets}
                        onChange={(event) =>
                          updateRow(row.key, { sets: event.target.value })
                        }
                        className={FIELD}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium">Reps</span>
                      <input
                        name="item_reps"
                        type="number"
                        min={1}
                        value={row.reps}
                        onChange={(event) =>
                          updateRow(row.key, { reps: event.target.value })
                        }
                        className={FIELD}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium">Segundos</span>
                      <input
                        name="item_duration"
                        type="number"
                        min={1}
                        value={row.duration}
                        onChange={(event) =>
                          updateRow(row.key, { duration: event.target.value })
                        }
                        className={FIELD}
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                      <span className="text-xs font-medium">Nota</span>
                      <input
                        name="item_notes"
                        value={row.notes}
                        onChange={(event) =>
                          updateRow(row.key, { notes: event.target.value })
                        }
                        className={FIELD}
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

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
          disabled={pending || rows.length === 0}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Creando…" : "Crear rutina y generar enlace"}
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
