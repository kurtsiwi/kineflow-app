import "server-only";
import { randomBytes } from "node:crypto";
import type { Exercise } from "./exercise-model";
import type {
  Routine,
  RoutineItemLog,
  RoutineStatus,
  RoutineTracking,
} from "./patient-model";
import { createSupabaseServerClient } from "./supabase/server";

export type RoutineItemDetail = {
  id: string;
  position: number;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  notes: string | null;
  exercise: Pick<
    Exercise,
    | "id"
    | "name"
    | "category"
    | "body_area"
    | "difficulty"
    | "sets"
    | "reps"
    | "duration_seconds"
  >;
  logs: RoutineItemLog[];
};

export type RoutineDetail = Routine & {
  patient: { id: string; code: string };
  items: RoutineItemDetail[];
};

export type NewRoutineItem = {
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  notes: string | null;
};

/** Token del enlace del paciente: 64 hex, lo exige el check de la tabla. */
export function generateAccessToken(): string {
  return randomBytes(32).toString("hex");
}

/** Filas de la vista de seguimiento, para el dashboard. */
export async function listRoutineTracking(
  status?: RoutineStatus,
): Promise<RoutineTracking[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("routine_tracking")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No se pudo cargar el seguimiento: ${error.message}`);
  }

  return (data ?? []) as RoutineTracking[];
}

export async function getRoutine(id: string): Promise<RoutineDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("routines")
    .select(
      `*,
       patient:patients(id, code),
       items:routine_items(
         id, position, sets, reps, duration_seconds, notes,
         exercise:exercises(id, name, category, body_area, difficulty, sets, reps, duration_seconds),
         logs:routine_item_logs(completed_at, pain, effort)
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la rutina: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const routine = data as unknown as RoutineDetail;

  return {
    ...routine,
    items: [...routine.items]
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        ...item,
        logs: [...item.logs].sort((a, b) =>
          b.completed_at.localeCompare(a.completed_at),
        ),
      })),
  };
}

/**
 * Crea la rutina y sus items.
 *
 * La API REST de Supabase no abre transacciones entre llamadas, así que si
 * fallan los items se borra la rutina recién creada en vez de dejarla huérfana.
 * Si esto llegara a necesitar atomicidad real, el paso siguiente es moverlo a
 * una función de Postgres.
 */
export async function createRoutine(input: {
  patient_id: string;
  title: string;
  notes: string | null;
  starts_on: string | null;
  ends_on: string | null;
  items: NewRoutineItem[];
}): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      patient_id: input.patient_id,
      title: input.title,
      notes: input.notes,
      starts_on: input.starts_on,
      ends_on: input.ends_on,
      access_token: generateAccessToken(),
    })
    .select("id")
    .single();

  if (routineError || !routine) {
    throw new Error(
      `No se pudo crear la rutina: ${routineError?.message ?? "sin detalle"}`,
    );
  }

  const { error: itemsError } = await supabase.from("routine_items").insert(
    input.items.map((item, index) => ({
      routine_id: routine.id,
      exercise_id: item.exercise_id,
      position: index + 1,
      sets: item.sets,
      reps: item.reps,
      duration_seconds: item.duration_seconds,
      notes: item.notes,
    })),
  );

  if (itemsError) {
    await supabase.from("routines").delete().eq("id", routine.id);
    throw new Error(
      `No se pudieron agregar los ejercicios: ${itemsError.message}`,
    );
  }

  return routine.id;
}

export async function markRoutineSent(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("routines")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo marcar como enviada: ${error.message}`);
  }
}

/** Cerrar una rutina invalida su enlace: el paciente ya no puede abrirla. */
export async function setRoutineStatus(
  id: string,
  status: RoutineStatus,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("routines")
    .update({
      status,
      closed_at: status === "cerrada" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo cambiar el estado: ${error.message}`);
  }
}

/** El token solo se lee donde hay que armar el enlace para enviarlo. */
export async function getRoutineToken(id: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("routines")
    .select("access_token")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer el enlace: ${error.message}`);
  }

  return data?.access_token ?? null;
}
