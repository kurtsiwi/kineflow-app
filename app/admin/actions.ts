"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  DIFFICULTIES,
  slugify,
  type Difficulty,
  type ExerciseInput,
} from "@/lib/exercise-model";
import { EXERCISES_TAG } from "@/lib/exercises";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExerciseFormState = {
  error: string | null;
};

type ParseResult =
  | { ok: true; value: ExerciseInput }
  | { ok: false; error: string };

function text(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();

  return value === "" ? null : value;
}

function positiveInt(formData: FormData, field: string): number | null {
  const raw = String(formData.get(field) ?? "").trim();

  if (raw === "") {
    return null;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function parseExercise(formData: FormData): ParseResult {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 3) {
    return { ok: false, error: "El nombre debe tener al menos 3 caracteres." };
  }

  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);

  if (!slug) {
    return {
      ok: false,
      error: "El nombre debe incluir al menos una letra o un número.",
    };
  }

  const rawDifficulty = String(formData.get("difficulty") ?? "");
  const difficulty = DIFFICULTIES.includes(rawDifficulty as Difficulty)
    ? (rawDifficulty as Difficulty)
    : "principiante";

  return {
    ok: true,
    value: {
      name,
      slug,
      description: text(formData, "description"),
      category: text(formData, "category"),
      body_area: text(formData, "body_area"),
      difficulty,
      sets: positiveInt(formData, "sets"),
      reps: positiveInt(formData, "reps"),
      duration_seconds: positiveInt(formData, "duration_seconds"),
      video_url: text(formData, "video_url"),
      image_url: text(formData, "image_url"),
      published: formData.get("published") === "on",
    },
  };
}

function describeError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ya existe un ejercicio con ese enlace (slug). Cámbialo e intenta otra vez.";
  }

  return error.message;
}

export async function createExercise(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireUser();

  const parsed = parseExercise(formData);

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exercises").insert(parsed.value);

  if (error) {
    return { error: describeError(error) };
  }

  updateTag(EXERCISES_TAG);
  redirect("/admin/ejercicios");
}

export async function updateExercise(
  _prevState: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Falta el identificador del ejercicio." };
  }

  const parsed = parseExercise(formData);

  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("exercises")
    .update(parsed.value)
    .eq("id", id);

  if (error) {
    return { error: describeError(error) };
  }

  updateTag(EXERCISES_TAG);
  redirect("/admin/ejercicios");
}

export async function togglePublished(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("exercises")
    .update({ published: formData.get("published") === "true" })
    .eq("id", id);

  updateTag(EXERCISES_TAG);
}

export async function deleteExercise(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("exercises").delete().eq("id", id);

  updateTag(EXERCISES_TAG);
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  redirect("/login");
}
