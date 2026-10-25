import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Suspense } from "react";
import { getRoutineByToken, registerRoutineOpen } from "@/lib/patient-access";
import {
  formatDate,
  formatDateTime,
  formatItemDosage,
  type PatientRoutine,
  type PatientRoutineItem,
} from "@/lib/patient-model";
import { LogItemForm } from "./log-item-form";

/**
 * El enlace lleva un token en la URL: fuera de buscadores y sin previews en
 * redes, para que no quede cacheado ni indexado en ninguna parte.
 */
export const metadata: Metadata = {
  title: "Tus ejercicios",
  robots: { index: false, follow: false, nocache: true },
};

export default function PatientRoutinePage(
  props: PageProps<"/rutina/[token]">,
) {
  return (
    <main className="flex-1">
      <Suspense fallback={<RoutineSkeleton />}>
        <RoutineView params={props.params} />
      </Suspense>
    </main>
  );
}

async function RoutineView({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const routine = await getRoutineByToken(token);

  if (!routine) {
    notFound();
  }

  if (routine.status === "cerrada") {
    return <ClosedNotice />;
  }

  // Confirmación de apertura. Va en `after()` para que el registro no demore
  // la respuesta; corre por request porque la ruta depende del token.
  after(() => registerRoutineOpen(token));

  return <ActiveRoutine routine={routine} token={token} />;
}

function ActiveRoutine({
  routine,
  token,
}: {
  routine: PatientRoutine;
  token: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">
        Tus ejercicios
      </p>
      <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
        {routine.title}
      </h1>

      {routine.starts_on || routine.ends_on ? (
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          {formatDate(routine.starts_on)} al {formatDate(routine.ends_on)}
        </p>
      ) : null}

      {routine.notes ? (
        <p className="mt-6 rounded-xl bg-zinc-50 px-5 py-4 text-base leading-7 dark:bg-zinc-900">
          {routine.notes}
        </p>
      ) : null}

      <p className="mt-6 text-base leading-7 text-zinc-600 dark:text-zinc-400">
        Haz los ejercicios en orden y marca cada uno cuando lo termines. Si
        sientes dolor fuerte, detente y avisa a tu kinesiólogo.
      </p>

      <ol className="mt-10 flex flex-col gap-6">
        {routine.items.map((item, index) => (
          <ExerciseStep
            key={item.id}
            item={item}
            index={index}
            token={token}
          />
        ))}
      </ol>

      <p className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Este enlace es personal. No lo compartas.
      </p>
    </div>
  );
}

function ExerciseStep({
  item,
  index,
  token,
}: {
  item: PatientRoutineItem;
  index: number;
  token: string;
}) {
  const dosage = formatItemDosage(item);
  const lastLog = item.logs[0];

  return (
    <li className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      {item.image_url ? (
        // URL escrita por el kinesiólogo, puede ser de cualquier host.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}

      <div className="p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">
            {index + 1}. {item.name}
          </h2>
          {dosage ? (
            <span className="font-medium text-brand">{dosage}</span>
          ) : null}
        </div>

        {item.body_area ? (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {item.body_area}
          </p>
        ) : null}

        {item.description ? (
          <p className="mt-4 text-base leading-7 text-zinc-700 dark:text-zinc-300">
            {item.description}
          </p>
        ) : null}

        {item.notes ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {item.notes}
          </p>
        ) : null}

        {item.video_url ? (
          <a
            href={item.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block font-semibold text-brand hover:underline"
          >
            Ver video →
          </a>
        ) : null}

        {item.logs.length > 0 ? (
          <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
            Lo marcaste {item.logs.length}{" "}
            {item.logs.length === 1 ? "vez" : "veces"}
            {lastLog ? ` · última: ${formatDateTime(lastLog.completed_at)}` : ""}
          </p>
        ) : null}

        <LogItemForm token={token} itemId={item.id} />
      </div>
    </li>
  );
}

function ClosedNotice() {
  return (
    <div className="mx-auto w-full max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Esta rutina ya finalizó
      </h1>
      <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
        Tu kinesiólogo la cerró. Si necesitas seguir con los ejercicios,
        pídele un enlace nuevo.
      </p>
    </div>
  );
}

function RoutineSkeleton() {
  return (
    <div aria-hidden className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="h-9 w-80 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-10 flex flex-col gap-6">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900"
          />
        ))}
      </div>
    </div>
  );
}
