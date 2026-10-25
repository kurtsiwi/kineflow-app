import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import {
  describeOpens,
  formatDate,
  formatDateTime,
  type RoutineTracking,
} from "@/lib/patient-model";
import { listRoutineTracking } from "@/lib/routines";

export const metadata: Metadata = {
  title: "Seguimiento",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seguimiento</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Quién abrió su rutina y qué ejercicios marcó como realizados.
          </p>
        </div>

        <Link
          href="/admin/rutinas/nueva"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nueva rutina
        </Link>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <Tracking />
      </Suspense>
    </div>
  );
}

async function Tracking() {
  await requireUser();
  const routines = await listRoutineTracking();

  const active = routines.filter((routine) => routine.status === "activa");
  const unopened = active.filter((routine) => !routine.first_opened_at);
  const logsThisWeek = active.reduce(
    (total, routine) => total + routine.logs_last_7d,
    0,
  );

  return (
    <>
      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Rutinas activas" value={active.length} />
        <Stat
          label="Sin abrir"
          value={unopened.length}
          tone={unopened.length > 0 ? "warn" : "ok"}
        />
        <Stat label="Registros últimos 7 días" value={logsThisWeek} />
      </dl>

      {routines.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no hay rutinas asignadas. Crea un paciente y asígnale una.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {routines.map((routine) => (
            <RoutineRow key={routine.id} routine={routine} />
          ))}
        </ul>
      )}
    </>
  );
}

function RoutineRow({ routine }: { routine: RoutineTracking }) {
  const opens = describeOpens(routine);

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            {routine.patient_code}
          </span>
          <Link
            href={`/admin/rutinas/${routine.id}`}
            className="truncate font-medium hover:underline"
          >
            {routine.title}
          </Link>
          {routine.status === "cerrada" ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Cerrada
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {routine.item_count}{" "}
          {routine.item_count === 1 ? "ejercicio" : "ejercicios"} ·{" "}
          {routine.starts_on
            ? `desde ${formatDate(routine.starts_on)}`
            : `creada ${formatDate(routine.created_at)}`}
          {routine.last_log_at
            ? ` · último registro ${formatDateTime(routine.last_log_at)}`
            : " · sin registros"}
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <ToneBadge tone={opens.tone}>{opens.label}</ToneBadge>
        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
          {routine.logs_last_7d} / 7 días
        </span>
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  tone = "ok",
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`mt-1 text-3xl font-semibold tabular-nums ${
          tone === "warn" ? "text-amber-600 dark:text-amber-400" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function ToneBadge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "idle";
  children: React.ReactNode;
}) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    warn: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    idle: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  }[tone];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>
      {children}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden className="mt-10 flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div
            key={card}
            className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
