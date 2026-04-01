"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

/* ─── Field validation helpers ─────────────────────────────────────── */
function validateName(v: string) {
  if (!v.trim()) return "Введіть ваше ім'я";
  if (v.trim().length < 2) return "Ім'я занадто коротке";
  return null;
}
function validateEmail(v: string) {
  if (!v.trim()) return "Введіть email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Невірний формат email";
  return null;
}
function validatePassword(v: string) {
  if (!v) return "Введіть пароль";
  if (v.length < 6) return "Мінімум 6 символів";
  return null;
}

/* ─── Input component ───────────────────────────────────────────────── */
interface InputFieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

function InputField({
  id,
  label,
  type,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  rightElement,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-500 text-[#CBD5E1]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={[
            "w-full rounded-xl px-4 py-3 text-sm text-[#E2E8F0]",
            "bg-[#0D1B3E] border outline-none transition-all duration-200",
            "placeholder:text-[#8A9BB5] focus:ring-2 focus:ring-[#F97316]/40",
            rightElement ? "pr-12" : "",
            error
              ? "border-red-500 focus:border-red-500"
              : "border-[#1A2C5B] focus:border-[#F97316]",
          ].join(" ")}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400" role="alert">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Password strength bar ─────────────────────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  const colors = ["#EF4444", "#F97316", "#FACC15", "#22C55E"];
  const labels = ["Слабкий", "Задовільний", "Добрий", "Надійний"];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              background: i < score ? colors[score - 1] : "#1A2C5B",
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: colors[score - 1] ?? "#8A9BB5" }}>
        {score > 0 ? labels[score - 1] : ""}
      </p>
    </div>
  );
}

/* ─── Register Page ─────────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [nameErr, setNameErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function validate() {
    const ne = validateName(name);
    const ee = validateEmail(email);
    const pe = validatePassword(password);
    setNameErr(ne);
    setEmailErr(ee);
    setPasswordErr(pe);
    return !ne && !ee && !pe;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    startTransition(async () => {
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setServerError("Цей email вже зареєстровано. Спробуйте увійти.");
        } else {
          setServerError(authError.message);
        }
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setServerError("Не вдалося отримати ID користувача. Спробуйте ще раз.");
        return;
      }

      // 2. Insert row into public.users
      const { error: dbError } = await supabase.from("users").insert({
        id: userId,
        email: email.trim(),
        name: name.trim(),
        role: "user",
        survey_answers: null,
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        // Non-blocking — auth succeeded, profile insert failed
        console.error("Profile insert error:", dbError.message);
      }

      setSuccess(true);

      // Give user a moment to see success state, then redirect
      setTimeout(() => {
        router.push("/app/dashboard");
      }, 1200);
    });
  }

  /* ── Success state ───────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl p-8 text-center"
        style={{ background: "#1A2C5B", border: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
          <CheckCircle2 size={36} className="text-green-400" />
        </span>
        <h2 className="text-xl font-700 text-[#E2E8F0]">Вітаємо в Skill Boost!</h2>
        <p className="text-sm text-[#8A9BB5]">Акаунт створено. Переходимо до дашборду…</p>
        <Loader2 size={20} className="animate-spin text-[#F97316]" />
      </div>
    );
  }

  /* ── Form ────────────────────────────────────────────────────────── */
  return (
    <div
      className="rounded-2xl p-6 shadow-[0_4px_32px_rgba(0,0,0,0.4)]"
      style={{ background: "#1A2C5B", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-800 text-[#E2E8F0]">Реєстрація</h1>
        <p className="mt-1 text-sm text-[#8A9BB5]">
          Створіть акаунт і починайте навчання безкоштовно
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <InputField
          id="register-name"
          label="Ім'я"
          type="text"
          value={name}
          onChange={(v) => { setName(v); if (nameErr) setNameErr(validateName(v)); }}
          error={nameErr}
          placeholder="Іван Петренко"
          autoComplete="name"
        />

        <InputField
          id="register-email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); if (emailErr) setEmailErr(validateEmail(v)); }}
          error={emailErr}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div className="flex flex-col gap-1.5">
          <InputField
            id="register-password"
            label="Пароль"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(v) => { setPassword(v); if (passwordErr) setPasswordErr(validatePassword(v)); }}
            error={passwordErr}
            placeholder="Мінімум 6 символів"
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="text-[#8A9BB5] transition-colors hover:text-[#E2E8F0]"
                aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          <PasswordStrength password={password} />
        </div>

        {/* Server error */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{serverError}</p>
          </div>
        )}

        {/* Terms note */}
        <p className="text-center text-[11px] text-[#8A9BB5]">
          Реєструючись, ви погоджуєтесь з{" "}
          <span className="text-[#F97316]">Умовами використання</span>
        </p>

        {/* Submit */}
        <button
          id="register-submit"
          type="submit"
          disabled={isPending}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-full py-3.5",
            "text-sm font-700 text-white transition-all duration-200",
            "bg-[#F97316] hover:bg-[#EA6C10]",
            "hover:shadow-[0_0_24px_rgba(249,115,22,0.5)]",
            "disabled:opacity-60 disabled:cursor-not-allowed",
            "active:scale-[0.97]",
          ].join(" ")}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Створення акаунту…
            </>
          ) : (
            "Створити акаунт"
          )}
        </button>
      </form>

      {/* Switch to login */}
      <p className="mt-5 text-center text-sm text-[#8A9BB5]">
        Вже є акаунт?{" "}
        <Link
          href="/login"
          className="font-600 text-[#F97316] transition-opacity hover:opacity-80"
        >
          Увійти
        </Link>
      </p>
    </div>
  );
}
