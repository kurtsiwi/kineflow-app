import "server-only";
import { io } from "next/cache";
import type { PatientRoutine } from "./patient-model";
import { createPublicClient } from "./supabase/public";

/**
 * Acceso del paciente por token. Todo pasa por funciones `security definer`
 * de Postgres: `anon` no tiene permiso de RLS sobre ninguna de las tablas de
 * rutinas, así que el token es la única llave y la base es la que decide.
 *
 * El `io()` es por lo mismo que en `createSupabaseServerClient`: el cliente de
 * Supabase mira el reloj al construirse y eso no puede caer en el prerender.
 */
export async function getRoutineByToken(
  token: string,
): Promise<PatientRoutine | null> {
  await io();

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("routine_by_token", {
    p_token: token,
  });

  if (error) {
    throw new Error(`No se pudo cargar la rutina: ${error.message}`);
  }

  return (data as PatientRoutine | null) ?? null;
}

/**
 * Marca que el paciente abrió el enlace. Se llama desde `after()`, o sea una
 * vez terminado el render: sin `io()` a propósito, porque ahí quedaría
 * suspendido y el callback se descartaría sin registrar nada.
 */
export async function registerRoutineOpen(token: string): Promise<void> {
  const supabase = createPublicClient();
  const { error } = await supabase.rpc("register_routine_open", {
    p_token: token,
  });

  if (error) {
    // El seguimiento no debe tumbar la página del paciente.
    console.error("No se pudo registrar la apertura:", error.message);
  }
}

/** Se llama desde una Server Action, que nunca se prerenderiza. */
export async function logRoutineItem(
  token: string,
  itemId: string,
  pain: number | null,
  effort: number | null,
): Promise<void> {
  const supabase = createPublicClient();
  const { error } = await supabase.rpc("log_routine_item", {
    p_token: token,
    p_item_id: itemId,
    p_pain: pain,
    p_effort: effort,
  });

  if (error) {
    throw new Error(error.message);
  }
}
