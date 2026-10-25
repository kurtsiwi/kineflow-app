"use client";

import { deleteExercise } from "./actions";

export function DeleteExerciseButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteExercise}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Eliminar "${name}"? Esta acción no se puede deshacer.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
      >
        Eliminar
      </button>
    </form>
  );
}
