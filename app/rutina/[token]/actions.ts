"use server";

import { refresh } from "next/cache";
import { logRoutineItem } from "@/lib/patient-access";

export type LogState = {
  error: string | null;
  done: boolean;
};

function parseScale(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();

  if (raw === "") {
    return null;
  }

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10
    ? parsed
    : null;
}

/**
 * El token viene del formulario porque ya está en la URL que el paciente
 * abrió: es la credencial, y la función de Postgres vuelve a validar que el
 * ejercicio pertenezca a esa rutina y que la rutina siga activa.
 */
export async function logItemAction(
  _prevState: LogState,
  formData: FormData,
): Promise<LogState> {
  const token = String(formData.get("token") ?? "");
  const itemId = String(formData.get("item_id") ?? "");

  if (!token || !itemId) {
    return { error: "Faltan datos del ejercicio.", done: false };
  }

  try {
    await logRoutineItem(
      token,
      itemId,
      parseScale(formData.get("pain")),
      parseScale(formData.get("effort")),
    );
  } catch {
    return {
      error: "No se pudo registrar. El enlace puede haber caducado.",
      done: false,
    };
  }

  refresh();

  return { error: null, done: true };
}
