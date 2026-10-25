"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPatient, type PatientFormState } from "./actions";

const INITIAL_STATE: PatientFormState = { error: null };

const FIELD =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand dark:border-zinc-800 dark:bg-zinc-950";

export function PatientForm() {
  const [state, formAction, pending] = useActionState(
    createPatient,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // La action no redirige (el listado está en la misma página), así que
  // limpiamos el formulario cuando el alta sale bien.
  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800"
    >
      <h2 className="font-medium">Nuevo paciente</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Solo nombre y email. El alias se genera solo si lo dejas vacío.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Nombre</span>
          <input name="full_name" required minLength={3} className={FIELD} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required className={FIELD} />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium">Alias (opcional)</span>
          <input name="code" placeholder="PAC-0001" className={FIELD} />
        </label>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Guardando…" : "Crear paciente"}
      </button>
    </form>
  );
}
