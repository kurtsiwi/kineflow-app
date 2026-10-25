"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { slugify } from "@/lib/exercise-model";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PatientFormState = {
  error: string | null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Crea el paciente en dos pasos: primero el alias (`patients`), después el
 * contacto. Si el contacto falla se borra el alias, porque un paciente sin
 * forma de contactarlo no sirve para nada.
 */
export async function createPatient(
  _prevState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  await requireUser();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const rawCode = String(formData.get("code") ?? "").trim();

  if (fullName.length < 3) {
    return { error: "El nombre debe tener al menos 3 caracteres." };
  }

  if (!EMAIL.test(email)) {
    return { error: "El email no tiene un formato válido." };
  }

  const supabase = await createSupabaseServerClient();

  // Sin `code` la base genera uno con la secuencia (PAC-0001, PAC-0002…).
  const code = rawCode ? slugify(rawCode).toUpperCase() : undefined;

  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert(code ? { code } : {})
    .select("id")
    .single();

  if (patientError || !patient) {
    return {
      error:
        patientError?.code === "23505"
          ? "Ya existe un paciente con ese alias."
          : (patientError?.message ?? "No se pudo crear el paciente."),
    };
  }

  const { error: contactError } = await supabase
    .from("patient_contacts")
    .insert({ patient_id: patient.id, full_name: fullName, email });

  if (contactError) {
    await supabase.from("patients").delete().eq("id", patient.id);

    return {
      error:
        contactError.code === "23505"
          ? "Ya hay un paciente registrado con ese email."
          : contactError.message,
    };
  }

  refresh();

  return { error: null };
}

export async function archivePatient(formData: FormData): Promise<void> {
  await requireUser();

  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("patients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  refresh();
}
