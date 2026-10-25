import "server-only";
import type { Patient, PatientWithContact } from "./patient-model";
import { createSupabaseServerClient } from "./supabase/server";

/** PostgREST devuelve la relación 1:1 como objeto o como array según el caso. */
function normalizeContact(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return (value as PatientWithContact["contact"]) ?? null;
}

export async function listPatients(): Promise<PatientWithContact[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .select(
      "id, code, created_at, archived_at, contact:patient_contacts(patient_id, full_name, email)",
    )
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No se pudieron cargar los pacientes: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    ...(row as unknown as Patient),
    contact: normalizeContact((row as Record<string, unknown>).contact),
  }));
}

/**
 * Solo id y alias. Es lo que necesita el formulario de rutinas, y así la
 * pantalla de asignación nunca carga nombre ni email.
 */
export async function listPatientCodes(): Promise<Patient[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, code, created_at, archived_at")
    .is("archived_at", null)
    .order("code");

  if (error) {
    throw new Error(`No se pudieron cargar los pacientes: ${error.message}`);
  }

  return (data ?? []) as Patient[];
}

/** Contacto de un paciente. Se llama solo donde hay que enviar el enlace. */
export async function getPatientContact(patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patient_contacts")
    .select("patient_id, full_name, email")
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar el contacto: ${error.message}`);
  }

  return data;
}
