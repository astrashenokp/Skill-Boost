"use client";

import { useState, useTransition, useRef } from "react";
import {
  createCourse, updateCourse, deleteCourse,
  createLesson, updateLesson, deleteLesson,
} from "@/app/(admin)/admin/actions";
import {
  Loader2, Plus, Pencil, Trash2, AlertCircle,
  CheckCircle2, ChevronDown, BookOpen, Users,
  TrendingUp, Award, X,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  order: number;
  lesson_count: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCompleted: number;
  topCourses: { id: string; title: string; completions: number }[];
}

export interface AdminClientProps {
  courses: Course[];
  lessons: Lesson[];
  stats: AdminStats;
}

const CATEGORIES = ["IT", "Маркетинг", "Фінанси", "Дизайн", "Менеджмент"];

/* ═══════════════════════════════════════════════════════════════════════
   Shared UI helpers
   ═══════════════════════════════════════════════════════════════════════ */
function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={[
        "fixed bottom-24 left-1/2 z-50 -translate-x-1/2",
        "flex max-w-sm items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl animate-slide-up",
        type === "success"
          ? "border border-green-500/30 bg-green-500/15 text-green-300"
          : "border border-red-500/30 bg-red-500/15 text-red-300",
      ].join(" ")}
    >
      {type === "success" ? (
        <CheckCircle2 size={16} className="shrink-0" />
      ) : (
        <AlertCircle size={16} className="shrink-0" />
      )}
      <span className="text-sm font-500">{msg}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100"
        aria-label="Закрити"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-600 uppercase tracking-wide text-[#8A9BB5]">
      {children}
    </label>
  );
}

function TextInput({
  name, defaultValue = "", placeholder = "", required = false,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      className={[
        "w-full rounded-xl bg-[#0D1B3E] border border-[#1A2C5B]",
        "px-3 py-2.5 text-sm text-[#E2E8F0] outline-none",
        "placeholder:text-[#8A9BB5] focus:border-[#F97316] transition-colors",
      ].join(" ")}
    />
  );
}

function TextareaInput({
  name, defaultValue = "", placeholder = "", rows = 6,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      className={[
        "w-full rounded-xl bg-[#0D1B3E] border border-[#1A2C5B]",
        "px-3 py-2.5 text-sm text-[#E2E8F0] outline-none resize-none",
        "placeholder:text-[#8A9BB5] focus:border-[#F97316] transition-colors",
        "font-mono leading-6",
      ].join(" ")}
    />
  );
}

function SelectInput({
  name, defaultValue = "", options, required = false,
}: {
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={[
          "w-full appearance-none rounded-xl bg-[#0D1B3E] border border-[#1A2C5B]",
          "px-3 py-2.5 pr-8 text-sm text-[#E2E8F0] outline-none",
          "focus:border-[#F97316] transition-colors cursor-pointer",
        ].join(" ")}
      >
        <option value="">Оберіть...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9BB5]"
      />
    </div>
  );
}

/* ─── Modal / Dialog ─────────────────────────────────────────────────── */
function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className={[
          "relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl",
          "max-h-[90dvh] overflow-y-auto",
          "animate-slide-up",
        ].join(" ")}
        style={{
          background: "#1A2C5B",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
          <h2 className="text-base font-700 text-[#E2E8F0]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1B3E] text-[#8A9BB5] transition-colors hover:text-[#E2E8F0]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─── Confirm delete dialog ──────────────────────────────────────────── */
function ConfirmDelete({
  open,
  label,
  onConfirm,
  onCancel,
  pending,
}: {
  open: boolean;
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <Modal open={open} title="Підтвердити видалення" onClose={onCancel}>
      <p className="mb-5 text-sm text-[#8A9BB5]">
        Ви впевнені, що хочете видалити{" "}
        <span className="font-600 text-[#E2E8F0]">«{label}»</span>?
        Цю дію не можна скасувати.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-[rgba(255,255,255,0.08)] py-2.5 text-sm font-600 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
        >
          Скасувати
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-500 py-2.5 text-sm font-700 text-white transition-all hover:bg-red-600 disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          Видалити
        </button>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Tab 1 — Courses
   ═══════════════════════════════════════════════════════════════════════ */
function CoursesTab({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState(initialCourses);
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const addFormRef = useRef<HTMLFormElement>(null);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Course | null>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(addFormRef.current!);
    startTransition(async () => {
      try {
        await createCourse(fd);
        setAddOpen(false);
        addFormRef.current?.reset();
        showToast("Курс успішно додано!", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Помилка", "error");
      }
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(editFormRef.current!);
    startTransition(async () => {
      try {
        await updateCourse(fd);
        setEditTarget(null);
        showToast("Курс оновлено!", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Помилка", "error");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      try {
        await deleteCourse(fd);
        setDeleteTarget(null);
        showToast("Курс видалено.", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Помилка", "error");
      }
    });
  }

  return (
    <>
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8A9BB5]">{courses.length} курсів</p>
        <button
          id="admin-add-course"
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-full bg-[#F97316] px-4 py-2 text-sm font-700 text-white hover:bg-[#EA6C10] transition-all active:scale-95"
        >
          <Plus size={15} />
          Додати курс
        </button>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#0D1B3E", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Назва", "Категорія", "Уроків", "Дії"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wider text-[#8A9BB5]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-[#8A9BB5]">
                    Курсів ще немає. Додайте перший!
                  </td>
                </tr>
              ) : (
                courses.map((course, i) => (
                  <tr
                    key={course.id}
                    className="transition-colors hover:bg-[#223570]/40"
                    style={{
                      background: i % 2 === 0 ? "#1A2C5B" : "rgba(26,44,91,0.6)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td className="max-w-[180px] truncate px-4 py-3 font-500 text-[#E2E8F0]">
                      {course.title}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-700"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#F97316" }}
                      >
                        {course.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8A9BB5]">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {course.lesson_count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTarget(course)}
                          aria-label={`Редагувати курс: ${course.title}`}
                          className="flex items-center gap-1 rounded-lg bg-[#223570] px-2.5 py-1.5 text-xs font-600 text-[#8A9BB5] transition-colors hover:text-[#E2E8F0]"
                        >
                          <Pencil size={11} /> Ред.
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(course)}
                          aria-label={`Видалити курс: ${course.title}`}
                          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-600 text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          <Trash2 size={11} /> Вид.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      <Modal open={addOpen} title="Додати курс" onClose={() => setAddOpen(false)}>
        <form ref={addFormRef} onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Назва *</FieldLabel>
            <TextInput name="title" placeholder="Назва курсу" required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Опис</FieldLabel>
            <TextareaInput name="description" placeholder="Короткий опис курсу..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Категорія *</FieldLabel>
            <SelectInput
              name="category"
              required
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>URL зображення</FieldLabel>
            <TextInput name="image_url" placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)}
              className="flex-1 rounded-full border border-[rgba(255,255,255,0.08)] py-3 text-sm font-600 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
            >
              Скасувати
            </button>
            <button type="submit" disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F97316] py-3 text-sm font-700 text-white hover:bg-[#EA6C10] disabled:opacity-60 transition-all"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Додати
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal open={!!editTarget} title="Редагувати курс" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <form ref={editFormRef} onSubmit={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={editTarget.id} />
            <div className="space-y-1.5">
              <FieldLabel>Назва *</FieldLabel>
              <TextInput name="title" defaultValue={editTarget.title} required />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Опис</FieldLabel>
              <TextareaInput name="description" defaultValue={editTarget.description} rows={3} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Категорія *</FieldLabel>
              <SelectInput
                name="category"
                defaultValue={editTarget.category}
                required
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>URL зображення</FieldLabel>
              <TextInput name="image_url" defaultValue={editTarget.image_url ?? ""} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditTarget(null)}
                className="flex-1 rounded-full border border-[rgba(255,255,255,0.08)] py-3 text-sm font-600 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
              >
                Скасувати
              </button>
              <button type="submit" disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F97316] py-3 text-sm font-700 text-white hover:bg-[#EA6C10] disabled:opacity-60 transition-all"
              >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Зберегти
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget?.title ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        pending={isPending}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Tab 2 — Lessons
   ═══════════════════════════════════════════════════════════════════════ */
function LessonsTab({
  courses,
  initialLessons,
}: {
  courses: Course[];
  initialLessons: Lesson[];
}) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const visibleLessons = initialLessons.filter(
    (l) => l.course_id === selectedCourseId
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(addFormRef.current!);
    fd.set("course_id", selectedCourseId);
    startTransition(async () => {
      try {
        await createLesson(fd);
        setAddOpen(false);
        addFormRef.current?.reset();
        showToast("Урок додано!", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Помилка", "error");
      }
    });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(editFormRef.current!);
    startTransition(async () => {
      try {
        await updateLesson(fd);
        setEditTarget(null);
        showToast("Урок оновлено!", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Помилка", "error");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      try {
        await deleteLesson(fd);
        setDeleteTarget(null);
        showToast("Урок видалено.", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Помилка", "error");
      }
    });
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Course selector */}
        <div className="relative flex-1 min-w-[200px]">
          <SelectInput
            name="course_filter"
            defaultValue={selectedCourseId}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
          />
        </div>
        <button
          id="admin-add-lesson"
          type="button"
          onClick={() => setAddOpen(true)}
          disabled={!selectedCourseId}
          className="flex items-center gap-2 rounded-full bg-[#F97316] px-4 py-2 text-sm font-700 text-white hover:bg-[#EA6C10] disabled:opacity-50 transition-all active:scale-95"
        >
          <Plus size={15} />
          Додати урок
        </button>
      </div>

      {/* Course selector onChange hack via form */}
      <div className="mb-2 flex flex-wrap gap-2">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCourseId(c.id)}
            className={[
              "rounded-full px-3 py-1 text-xs font-600 transition-all",
              selectedCourseId === c.id
                ? "bg-[#F97316] text-white"
                : "bg-[#1A2C5B] text-[#8A9BB5] hover:text-[#E2E8F0]",
            ].join(" ")}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Lessons table */}
      <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#0D1B3E", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["#", "Назва уроку", "Символів", "Дії"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-700 uppercase tracking-wider text-[#8A9BB5]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLessons.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-[#8A9BB5]">
                    {selectedCourseId
                      ? "У цьому курсі ще немає уроків"
                      : "Оберіть курс вище"}
                  </td>
                </tr>
              ) : (
                visibleLessons.map((lesson, i) => (
                  <tr
                    key={lesson.id}
                    className="transition-colors hover:bg-[#223570]/40"
                    style={{
                      background: i % 2 === 0 ? "#1A2C5B" : "rgba(26,44,91,0.6)",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <td className="px-4 py-3 text-[#8A9BB5]">{lesson.order}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-500 text-[#E2E8F0]">
                      {lesson.title}
                    </td>
                    <td className="px-4 py-3 text-[#8A9BB5]">
                      {lesson.content?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditTarget(lesson)}
                          aria-label={`Редагувати: ${lesson.title}`}
                          className="flex items-center gap-1 rounded-lg bg-[#223570] px-2.5 py-1.5 text-xs font-600 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
                        >
                          <Pencil size={11} /> Ред.
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(lesson)}
                          aria-label={`Видалити: ${lesson.title}`}
                          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-600 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 size={11} /> Вид.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lesson Modal */}
      <Modal open={addOpen} title="Додати урок" onClose={() => setAddOpen(false)}>
        <form ref={addFormRef} onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>Назва уроку *</FieldLabel>
            <TextInput name="title" placeholder="Назва уроку" required />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Порядок</FieldLabel>
            <TextInput name="order" defaultValue={String(visibleLessons.length + 1)} />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Зміст (Markdown)</FieldLabel>
            <TextareaInput name="content" placeholder="## Заголовок&#10;&#10;Текст уроку..." rows={8} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAddOpen(false)}
              className="flex-1 rounded-full border border-[rgba(255,255,255,0.08)] py-3 text-sm font-600 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
            >
              Скасувати
            </button>
            <button type="submit" disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F97316] py-3 text-sm font-700 text-white hover:bg-[#EA6C10] disabled:opacity-60 transition-all"
            >
              {isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Додати
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Lesson Modal */}
      <Modal open={!!editTarget} title="Редагувати урок" onClose={() => setEditTarget(null)}>
        {editTarget && (
          <form ref={editFormRef} onSubmit={handleEdit} className="space-y-4">
            <input type="hidden" name="id" value={editTarget.id} />
            <div className="space-y-1.5">
              <FieldLabel>Назва *</FieldLabel>
              <TextInput name="title" defaultValue={editTarget.title} required />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Порядок</FieldLabel>
              <TextInput name="order" defaultValue={String(editTarget.order)} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Зміст (Markdown)</FieldLabel>
              <TextareaInput name="content" defaultValue={editTarget.content ?? ""} rows={8} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditTarget(null)}
                className="flex-1 rounded-full border border-[rgba(255,255,255,0.08)] py-3 text-sm font-600 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
              >
                Скасувати
              </button>
              <button type="submit" disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#F97316] py-3 text-sm font-700 text-white hover:bg-[#EA6C10] disabled:opacity-60 transition-all"
              >
                {isPending ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                Зберегти
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        label={deleteTarget?.title ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        pending={isPending}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Tab 3 — Stats
   ═══════════════════════════════════════════════════════════════════════ */
function StatsTab({ stats }: { stats: AdminStats }) {
  const medals = ["🥇", "🥈", "🥉"];

  const statCards = [
    {
      icon: <Users size={22} />,
      value: stats.totalUsers,
      label: "Користувачів",
      sub: "зареєстровано",
      color: "#818CF8",
    },
    {
      icon: <BookOpen size={22} />,
      value: stats.totalCompleted,
      label: "Завершень курсів",
      sub: "всього",
      color: "#22C55E",
    },
    {
      icon: <Award size={22} />,
      value: stats.topCourses.reduce((a, c) => a + c.completions, 0),
      label: "Активних учнів",
      sub: "із сертифікатами",
      color: "#F97316",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center"
            style={{
              background: "#1A2C5B",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <span className="text-2xl font-800" style={{ color: s.color }}>
              {s.value}
            </span>
            <div>
              <p className="text-xs font-600 text-[#E2E8F0]">{s.label}</p>
              <p className="text-[10px] text-[#8A9BB5]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 courses */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#F97316]" />
          <h3 className="text-sm font-700 text-[#E2E8F0]">
            Топ-3 популярних курси
          </h3>
        </div>
        <div className="space-y-3">
          {stats.topCourses.length === 0 ? (
            <p className="text-center py-6 text-sm text-[#8A9BB5]">
              Учні ще не завершили жодного курсу
            </p>
          ) : (
            stats.topCourses.map((course, i) => (
              <div
                key={course.id}
                className="flex items-center gap-4 rounded-2xl px-4 py-4"
                style={{
                  background: "#1A2C5B",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span className="text-2xl" aria-label={`${i + 1} місце`}>
                  {medals[i]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-600 text-[#E2E8F0]">
                    {course.title}
                  </p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#0D1B3E]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, (course.completions / Math.max(...stats.topCourses.map((c) => c.completions), 1)) * 100)}%`,
                        background: "linear-gradient(90deg, #F97316, #FBBF24)",
                      }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-800 text-[#F97316]">
                    {course.completions}
                  </p>
                  <p className="text-[10px] text-[#8A9BB5]">завершень</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Root Admin Client
   ═══════════════════════════════════════════════════════════════════════ */
type TabKey = "courses" | "lessons" | "stats";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "courses", label: "Курси",      emoji: "📚" },
  { key: "lessons", label: "Уроки",      emoji: "📝" },
  { key: "stats",   label: "Статистика", emoji: "📊" },
];

export default function AdminClient({ courses, lessons, stats }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("courses");

  return (
    <div className="min-h-dvh pb-20" style={{ background: "#0D1B3E" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 px-4 pt-10 pb-4"
        style={{
          background: "linear-gradient(180deg, #0D1B3E 80%, rgba(13,27,62,0) 100%)",
        }}
      >
        <div className="mb-1 flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
          >
            <span className="text-sm">⚡</span>
          </div>
          <h1 className="text-xl font-800 text-[#E2E8F0]">Адмін-панель</h1>
          <span
            className="ml-1 rounded-full px-2 py-0.5 text-[10px] font-700 uppercase"
            style={{ background: "rgba(249,115,22,0.2)", color: "#F97316" }}
          >
            admin
          </span>
        </div>
        <p className="text-xs text-[#8A9BB5]">
          {courses.length} курсів · {lessons.length} уроків · {stats.totalUsers} учнів
        </p>

        {/* Tab bar */}
        <div
          className="mt-4 flex gap-1 rounded-2xl p-1"
          style={{ background: "#1A2C5B" }}
          role="tablist"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`admin-tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-700 transition-all duration-200",
                activeTab === tab.key
                  ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                  : "text-[#8A9BB5] hover:text-[#E2E8F0]",
              ].join(" ")}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Tab panels */}
      <div className="px-4">
        {activeTab === "courses" && (
          <div role="tabpanel" aria-labelledby="admin-tab-courses">
            <CoursesTab initialCourses={courses} />
          </div>
        )}
        {activeTab === "lessons" && (
          <div role="tabpanel" aria-labelledby="admin-tab-lessons">
            <LessonsTab courses={courses} initialLessons={lessons} />
          </div>
        )}
        {activeTab === "stats" && (
          <div role="tabpanel" aria-labelledby="admin-tab-stats">
            <StatsTab stats={stats} />
          </div>
        )}
      </div>
    </div>
  );
}
