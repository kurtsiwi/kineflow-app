"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  createRoutine,
  markRoutineSent,
  setRoutineStatus,
  type NewRoutineItem,
} from "@/lib/routines";

export type RoutineFormState = {
  error: string | null;
};

function positiveInt(value: FormDataEntryValue | undefined): number | null {
  const raw = String(value ?? "").trim();

  if (raw === "") {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();

  return text === "" ? null : text;
}

/**
 * Los ejercicios llegan como arrays paralelos (`item_exercise_id[]`,
 * `item_sets[]`, …) en el orden en que el formulario los muestra, y ese orden
 * es la posición dentro de la rutina.
 */
function parseItems(formData: FormData): NewRoutineItem[] {
  const exerciseIds = formData.getAll("item_exercise_id");
  const sets = formData.getAll("item_sets");
  const reps = formData.getAll("item_reps");
  const durations = formData.getAll("item_duration");
  const notes = formData.getAll("item_notes");

  return exerciseIds
    .map((exerciseId, index) => ({
      exercise_id: String(exerciseId),
      sets: positiveInt(sets[index]),
      reps: positiveInt(reps[index]),
      duration_seconds: positiveInt(durations[index]),
      notes: optionalText(notes[index] ?? null),
    }))
    .filter((item) => item.exercise_id !== "");
}

export async function createRoutineAction(
  _prevState: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  await requireUser();

  const patientId = String(formData.get("patient_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!patientId) {
    return { error: "Elige un paciente." };
  }

  if (title.length < 3) {
    return { error: "Ponle un título a la rutina (mínimo 3 caracteres)." };
  }

  const items = parseItems(formData);

  if (items.length === 0) {
    return { error: "Agrega al menos un ejercicio a la rutina." };
  }

  let routineId: string;

  try {
    routineId = await createRoutine({
      patient_id: patientId,
      title,
      notes: optionalText(formData.get("notes")),
      starts_on: optionalText(formData.get("starts_on")),
      ends_on: optionalText(formData.get("ends_on")),
      items,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo crear.",
    };
  }

  redirect(`/admin/rutinas/${routineId}`);
}

export async function markSentAction(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (id) {
    await markRoutineSent(id);
    refresh();
  }
}

export async function closeRoutineAction(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (id) {
    // Cerrar invalida el enlace: el paciente ya no puede abrir la rutina.
    await setRoutineStatus(id, "cerrada");
    refresh();
  }
}

export async function reopenRoutineAction(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (id) {
    await setRoutineStatus(id, "activa");
    refresh();
  }
}
