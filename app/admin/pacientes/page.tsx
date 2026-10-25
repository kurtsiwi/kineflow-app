import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/patient-model";
import { listPatients } from "@/lib/patients";
import { PatientForm } from "./patient-form";

export const metadata: Metadata = {
  title: "Pacientes",
};

export default function PatientsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        El alias es lo que se usa en el seguimiento; el nombre y el email solo
        sirven para enviarle el enlace.
      </p>

      <div className="mt-10">
        <PatientForm />
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <PatientList />
      </Suspense>
    </div>
  );
}

async function PatientList() {
  await requireUser();
  const patients = await listPatients();

  if (patients.length === 0) {
    return (
      <p className="mt-10 rounded-2xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Todavía no hay pacientes.
      </p>
    );
  }

  return (
    <ul className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {patients.map((patient) => (
        <li
          key={patient.id}
          className="flex flex-wrap items-center gap-4 px-5 py-4"
        >
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            {patient.code}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">
              {patient.contact?.full_name ?? "Sin contacto"}
            </p>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {patient.contact?.email ?? "—"} · desde{" "}
              {formatDate(patient.created_at)}
            </p>
          </div>

          <Link
            href={`/admin/rutinas/nueva?paciente=${patient.id}`}
            className="text-sm font-medium text-brand hover:underline"
          >
            Asignar rutina
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div
      aria-hidden
      className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
    >
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex flex-col gap-2 px-5 py-5">
          <div className="h-4 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}
