import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Exercise } from "./exercise-model";
import { createPublicClient } from "./supabase/public";
import { createSupabaseServerClient } from "./supabase/server";

/** Tag de cache del catálogo. Las mutaciones lo invalidan con `updateTag`. */
export const EXERCISES_TAG = "exercises";

const COLUMNS =
  "id, slug, name, description, category, body_area, difficulty, sets, reps, duration_seconds, video_url, image_url, published, created_at, updated_at";

/**
 * Catálogo público. Cacheado en el servidor, así que se prerenderiza dentro
 * del shell estático del home.
 */
export async function listPublishedExercises(): Promise<Exercise[]> {
  "use cache";
  cacheTag(EXERCISES_TAG);
  cacheLife("hours");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("exercises")
    .select(COLUMNS)
    .eq("published", true)
    .order("name");

  if (error) {
    throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  }

  return (data ?? []) as Exercise[];
}

/**
 * Todos los ejercicios, borradores incluidos. Usa el cliente con sesión: RLS
 * solo entrega los borradores a un usuario autenticado.
 */
export async function listAllExercises(): Promise<Exercise[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los ejercicios: ${error.message}`);
  }

  return (data ?? []) as Exercise[];
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el ejercicio: ${error.message}`);
  }

  return (data as Exercise | null) ?? null;
}
