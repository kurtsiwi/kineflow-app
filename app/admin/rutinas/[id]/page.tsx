import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getBaseUrl } from "@/lib/base-url";
import { formatDate, formatDateTime } from "@/lib/patient-model";
import { getPatientContact } from "@/lib/patients";
import { getRoutine, type RoutineItemDetail } from "@/lib/routines";
import { closeRoutineAction, markSentAction, reopenRoutineAction } from "../actions";
import { CopyLink } from "../copy-link";

export const metadata: Metadata = {
  title: "Rutina",
};

export default function RoutineDetailPage(
  props: PageProps<"/admin/rutinas/[id]">,
) {
  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link
        href="/admin"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Seguimiento
      </Link>

      <Suspense fallback={<DetailSkeleton />}>
        <RoutineDetail params={props.params} />
      </Suspense>
    </div>
  );
}

async function RoutineDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const routine = await getRoutine(id);

  if (!routine) {
    notFound();
  }

  // El contacto se lee solo acá, que es donde hay que enviar el enlace.
  const [contact, baseUrl] = await Promise.all([
    getPatientContact(routine.patient_id),
    getBaseUrl(),
  ]);

  const url = `${baseUrl}/rutina/${routine.access_token}`;
  const isActive = routine.status === "activa";

  const mailto = contact
    ? `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(
        `Tus ejercicios: ${routine.title}`,
      )}&body=${encodeURIComponent(
        `Hola ${contact.full_name}:\n\nAcá están tus ejercicios para esta semana:\n${url}\n\n` +
          `Marca cada ejercicio como realizado cuando lo termines.\n\nSaludos.`,
      )}`
    : null;

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {routine.title}
        </h1>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
          {routine.patient.code}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isActive
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {isActive ? "Activa" : "Cerrada"}
        </span>
      </div>

      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        {routine.starts_on || routine.ends_on
          ? `${formatDate(routine.starts_on)} → ${formatDate(routine.ends_on)}`
          : `Creada ${formatDate(routine.created_at)}`}
      </p>

      {routine.notes ? (
        <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-6 dark:bg-zinc-900">
          {routine.notes}
        </p>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      <section className="mt-10 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="font-medium">Enlace del paciente</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {contact
            ? `Se envía a ${contact.full_name} (${contact.email}).`
            : "Este paciente no tiene contacto registrado."}{" "}
          Quien tenga el enlace puede ver la rutina, así que no lo publiques.
        </p>

        <div className="mt-4">
          <CopyLink url={url} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          {mailto ? (
            <a
              href={mailto}
              className="font-medium text-brand hover:underline"
            >
              Abrir email con el enlace
            </a>
          ) : null}

          {routine.sent_at ? (
            <span className="text-zinc-500 dark:text-zinc-400">
              Enviada {formatDateTime(routine.sent_at)}
            </span>
          ) : (
            <form action={markSentAction}>
              <input type="hidden" name="id" value={routine.id} />
              <button
                type="submit"
                className="font-medium text-zinc-600 hover:underline dark:text-zinc-300"
              >
                Marcar como enviada
              </button>
            </form>
          )}

          <form action={isActive ? closeRoutineAction : reopenRoutineAction}>
            <input type="hidden" name="id" value={routine.id} />
            <button
              type="submit"
              className="font-medium text-zinc-600 hover:underline dark:text-zinc-300"
            >
              {isActive ? "Cerrar rutina" : "Reabrir rutina"}
            </button>
          </form>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Aperturas"
          value={routine.open_count.toString()}
          hint={
            routine.first_opened_at
              ? `primera ${formatDateTime(routine.first_opened_at)}`
              : "nunca abierta"
          }
        />
        <Stat
          label="Última apertura"
          value={routine.last_opened_at ? formatDateTime(routine.last_opened_at) : "—"}
        />
        <Stat
          label="Ejercicios"
          value={routine.items.length.toString()}
          hint={`${routine.items.reduce(
            (total, item) => total + item.logs.length,
            0,
          )} registros en total`}
        />
      </section>

      {/* ------------------------------------------------------------------ */}
      <h2 className="mt-10 font-medium">Ejercicios y registros</h2>

      <ol className="mt-4 flex flex-col gap-4">
        {routine.items.map((item, index) => (
          <ItemCard key={item.id} item={item} index={index} />
        ))}
      </ol>
    </>
  );
}

function ItemCard({
  item,
  index,
}: {
  item: RoutineItemDetail;
  index: number;
}) {
  const sets = item.sets ?? item.exercise.sets;
  const reps = item.reps ?? item.exercise.reps;
  const duration = item.duration_seconds ?? item.exercise.duration_seconds;

  const dosage = [
    sets ? `${sets} series` : null,
    reps ? `${reps} reps` : null,
    duration ? `${duration} s` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">
          {index + 1}. {item.exercise.name}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {dosage || "sin dosificación"}
        </span>
      </div>

      {item.notes ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {item.notes}
        </p>
      ) : null}

      {item.logs.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Sin registros todavía.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {item.logs.map((log) => (
            <li
              key={log.completed_at}
              className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-2 dark:border-zinc-900"
            >
              <span className="tabular-nums">
                {formatDateTime(log.completed_at)}
              </span>
              {log.pain !== null ? (
                <span
                  className={
                    log.pain >= 7
                      ? "font-medium text-rose-600 dark:text-rose-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                >
                  dolor {log.pain}/10
                </span>
              ) : null}
              {log.effort !== null ? (
                <span className="text-zinc-500 dark:text-zinc-400">
                  esfuerzo {log.effort}/10
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden className="mt-6 flex flex-col gap-6">
      <div className="h-8 w-72 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
    </div>
  );
}
