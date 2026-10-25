import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { listAllExercises } from "@/lib/exercises";
import { listPatientCodes } from "@/lib/patients";
import { RoutineForm } from "../routine-form";

export const metadata: Metadata = {
  title: "Nueva rutina",
};

export default function NewRoutinePage(
  props: PageProps<"/admin/rutinas/nueva">,
) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Nueva rutina</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Al crearla se genera el enlace único que le envías al paciente.
      </p>

      {/* Depende de la sesión y de searchParams: detrás del boundary. */}
      <Suspense fallback={<FormSkeleton />}>
        <FormLoader searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function FormLoader({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const { paciente } = await searchParams;
  const [patients, exercises] = await Promise.all([
    listPatientCodes(),
    listAllExercises(),
  ]);

  return (
    <RoutineForm
      patients={patients}
      exercises={exercises}
      defaultPatientId={typeof paciente === "string" ? paciente : null}
    />
  );
}

function FormSkeleton() {
  return (
    <div aria-hidden className="mt-10 flex flex-col gap-6">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="h-11 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900"
        />
      ))}
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
