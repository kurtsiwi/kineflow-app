"use client";

import { useActionState } from "react";
import { logItemAction, type LogState } from "./actions";

const INITIAL_STATE: LogState = { error: null, done: false };

const SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SELECT =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-base outline-none focus:border-brand dark:border-zinc-800 dark:bg-zinc-950";

export function LogItemForm({
  token,
  itemId,
}: {
  token: string;
  itemId: string;
}) {
  const [state, formAction, pending] = useActionState(
    logItemAction,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800"
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="item_id" value={itemId} />

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Dolor (0-10)</span>
          <select name="pain" defaultValue="" className={SELECT}>
            <option value="">No indico</option>
            {SCALE.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Esfuerzo (0-10)</span>
          <select name="effort" defaultValue="" className={SELECT}>
            <option value="">No indico</option>
            {SCALE.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-5 py-2.5 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Lo hice"}
        </button>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      {state.done ? (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Registrado. ¡Bien hecho!
        </p>
      ) : null}
    </form>
  );
}
