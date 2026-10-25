import type { Metadata } from "next";
import { createExercise } from "../../actions";
import { ExerciseForm } from "../exercise-form";

export const metadata: Metadata = {
  title: "Nuevo ejercicio",
};

export default function NewExercisePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nuevo ejercicio
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Déjalo como borrador si todavía no quieres que aparezca en el home.
      </p>

      <ExerciseForm action={createExercise} submitLabel="Crear ejercicio" />
    </div>
  );
}
