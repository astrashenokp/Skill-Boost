"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

/* ─── Auth guard helper ──────────────────────────────────────────────── */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return supabase;
}

/* ══ COURSE ACTIONS ═══════════════════════════════════════════════════ */

export async function createCourse(formData: FormData) {
  const supabase = await requireAdmin();

  const title       = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category    = String(formData.get("category") ?? "").trim();
  const image_url   = String(formData.get("image_url") ?? "").trim() || null;

  if (!title || !category) throw new Error("Назва та категорія обов'язкові");

  // Find highest order
  const { data: last } = await supabase
    .from("courses")
    .select("order")
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const order = ((last?.order as number) ?? 0) + 1;

  const { error } = await supabase.from("courses").insert({
    title, description, category, image_url, order,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateCourse(formData: FormData) {
  const supabase = await requireAdmin();

  const id          = String(formData.get("id") ?? "");
  const title       = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category    = String(formData.get("category") ?? "").trim();
  const image_url   = String(formData.get("image_url") ?? "").trim() || null;

  if (!id || !title || !category) throw new Error("ID, назва та категорія обов'язкові");

  const { error } = await supabase
    .from("courses")
    .update({ title, description, category, image_url })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteCourse(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID відсутній");

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

/* ══ LESSON ACTIONS ═══════════════════════════════════════════════════ */

export async function createLesson(formData: FormData) {
  const supabase = await requireAdmin();

  const course_id = String(formData.get("course_id") ?? "").trim();
  const title     = String(formData.get("title") ?? "").trim();
  const content   = String(formData.get("content") ?? "").trim();
  const order     = parseInt(String(formData.get("order") ?? "1"), 10);

  if (!course_id || !title) throw new Error("Курс та назва обов'язкові");

  const { error } = await supabase.from("lessons").insert({
    course_id, title, content, order,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateLesson(formData: FormData) {
  const supabase = await requireAdmin();

  const id      = String(formData.get("id") ?? "");
  const title   = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const order   = parseInt(String(formData.get("order") ?? "1"), 10);

  if (!id || !title) throw new Error("ID та назва обов'язкові");

  const { error } = await supabase
    .from("lessons")
    .update({ title, content, order })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteLesson(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("ID відсутній");

  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
