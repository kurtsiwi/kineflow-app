/**
 * Tipos y helpers puros del dominio. Sin `server-only`: los comparten los
 * Server Components, las Server Actions y los formularios del cliente.
 */

export const DIFFICULTIES = [
  "principiante",
  "intermedio",
  "avanzado",
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type Exercise = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  body_area: string | null;
  difficulty: Difficulty;
  sets: number | null;
  reps: number | null;
  duration_seconds: number | null;
  video_url: string | null;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ExerciseInput = Omit<Exercise, "id" | "created_at" | "updated_at">;

/** Categorías presentes en una lista, ordenadas para los filtros del home. */
export function collectCategories(exercises: Exercise[]): string[] {
  const categories = new Set<string>();

  for (const exercise of exercises) {
    if (exercise.category) {
      categories.add(exercise.category);
    }
  }

  return [...categories].sort((a, b) => a.localeCompare(b, "es"));
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
}

/** "3 series × 12 reps · 45 s" — resumen de dosificación para las tarjetas. */
export function formatDosage(exercise: Exercise): string | null {
  const parts: string[] = [];

  if (exercise.sets) {
    parts.push(`${exercise.sets} ${exercise.sets === 1 ? "serie" : "series"}`);
  }

  if (exercise.reps) {
    parts.push(`${exercise.reps} reps`);
  }

  if (exercise.duration_seconds) {
    parts.push(formatDuration(exercise.duration_seconds));
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
