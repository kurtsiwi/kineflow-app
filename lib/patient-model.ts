/**
 * Tipos y helpers del dominio de pacientes, rutinas y seguimiento.
 * Sin `server-only`: lo comparten Server Components, actions y formularios.
 */

import type { Difficulty } from "./exercise-model";

export type RoutineStatus = "activa" | "cerrada";

/** Alias no identificante. Es lo que se usa en seguimiento y reportes. */
export type Patient = {
  id: string;
  code: string;
  created_at: string;
  archived_at: string | null;
};

/** Datos identificantes. Se leen solo para enviar el enlace. */
export type PatientContact = {
  patient_id: string;
  full_name: string;
  email: string;
};

export type PatientWithContact = Patient & {
  contact: PatientContact | null;
};

export type Routine = {
  id: string;
  patient_id: string;
  title: string;
  notes: string | null;
  access_token: string;
  status: RoutineStatus;
  starts_on: string | null;
  ends_on: string | null;
  sent_at: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Fila de `public.routine_tracking`. No incluye `access_token`. */
export type RoutineTracking = {
  id: string;
  patient_id: string;
  patient_code: string;
  title: string;
  status: RoutineStatus;
  starts_on: string | null;
  ends_on: string | null;
  sent_at: string | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  created_at: string;
  item_count: number;
  log_count: number;
  logs_last_7d: number;
  last_log_at: string | null;
  days_since_sent: number | null;
};

export type RoutineItemLog = {
  completed_at: string;
  pain: number | null;
  effort: number | null;
};

/** Item tal como lo devuelve `routine_by_token`, ya resuelto con el ejercicio. */
export type PatientRoutineItem = {
  id: string;
  position: number;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  notes: string | null;
  name: string;
  description: string | null;
  category: string | null;
  body_area: string | null;
  difficulty: Difficulty;
  image_url: string | null;
  video_url: string | null;
  logs: RoutineItemLog[];
};

export type PatientRoutine = {
  id: string;
  title: string;
  notes: string | null;
  status: RoutineStatus;
  starts_on: string | null;
  ends_on: string | null;
  patient_code: string;
  items: PatientRoutineItem[];
};

/**
 * Fechas en zona de Chile y locale fijo, no la del runtime: así el servidor y
 * el cliente formatean igual y no hay desajuste de hidratación.
 */
const DATE_TIME = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Santiago",
});

const DATE_ONLY = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Santiago",
});

export function formatDateTime(iso: string | null): string {
  return iso ? DATE_TIME.format(new Date(iso)) : "—";
}

export function formatDate(iso: string | null): string {
  return iso ? DATE_ONLY.format(new Date(iso)) : "—";
}

/** Resumen de la apertura del enlace, que es la confirmación de seguimiento. */
export function describeOpens(routine: {
  open_count: number;
  first_opened_at: string | null;
  days_since_sent: number | null;
  sent_at: string | null;
}): { label: string; tone: "ok" | "warn" | "idle" } {
  if (routine.first_opened_at) {
    return {
      label: `Abierta ${routine.open_count} ${routine.open_count === 1 ? "vez" : "veces"}`,
      tone: "ok",
    };
  }

  if (!routine.sent_at) {
    return { label: "Sin enviar", tone: "idle" };
  }

  const days = routine.days_since_sent ?? 0;

  return {
    label:
      days >= 2
        ? `Sin abrir · ${days} días desde el envío`
        : "Sin abrir todavía",
    tone: days >= 2 ? "warn" : "idle",
  };
}

/** "3 series × 10 reps" para la ficha del paciente. */
export function formatItemDosage(item: {
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
}): string | null {
  const parts: string[] = [];

  if (item.sets) {
    parts.push(`${item.sets} ${item.sets === 1 ? "serie" : "series"}`);
  }

  if (item.reps) {
    parts.push(`${item.reps} reps`);
  }

  if (item.duration_seconds) {
    parts.push(
      item.duration_seconds < 60
        ? `${item.duration_seconds} s`
        : `${Math.round(item.duration_seconds / 60)} min`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
