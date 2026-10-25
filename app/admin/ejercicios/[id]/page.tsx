import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getExerciseById } from "@/lib/exercises";
import { updateExercise } from "../../actions";
import { ExerciseForm } from "../exercise-form";

export const metadata: Metadata = {
  title: "Editar ejercicio",
};

export default function EditExercisePage(
  props: PageProps<"/admin/ejercicios/[id]">,
) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Editar ejercicio
      </h1>

      {/* Depende de `params` y de la sesión: va detrás del boundary. */}
      <Suspense fallback={<FormSkeleton />}>
        <EditForm params={props.params} />
      </Suspense>
    </div>
  );
}

async function EditForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const exercise = await getExerciseById(id);

  if (!exercise) {
    notFound();
  }

  return (
    <ExerciseForm
      action={updateExercise}
      exercise={exercise}
      submitLabel="Guardar cambios"
    />
  );
}

function FormSkeleton() {
  return (
    <div aria-hidden className="mt-10 flex flex-col gap-6">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div
          key={row}
          className="h-11 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900"
        />
      ))}
    </div>
  );
}
