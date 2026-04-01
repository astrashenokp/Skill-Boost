"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

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

/* ─── Login Page ────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/app/dashboard";
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  /* ── Validation ──────────────────────────────────────────────────── */
  function validateEmail(v: string) {
    if (!v.trim()) return "Введіть email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Невірний формат email";
    return null;
  }
  function validatePassword(v: string) {
    if (!v) return "Введіть пароль";
    return null;
  }
  function validate() {
    const ee = validateEmail(email);
    const pe = validatePassword(password);
    setEmailErr(ee);
    setPasswordErr(pe);
    return !ee && !pe;
  }

  /* ── Submit ──────────────────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setServerError(null);

    startTransition(async () => {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid_credentials")
        ) {
          setServerError("Невірний email або пароль. Спробуйте ще раз.");
        } else if (error.message.includes("Email not confirmed")) {
          setServerError(
            "Підтвердьте email перед входом. Перевірте свою пошту."
          );
        } else {
          setServerError(error.message);
        }
        return;
      }

      // Successful login — redirect to intended page
      router.push(redirectTo);
      router.refresh();
    });
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div
      className="rounded-2xl p-6 shadow-[0_4px_32px_rgba(0,0,0,0.4)]"
      style={{ background: "#1A2C5B", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-800 text-[#E2E8F0]">Вхід</h1>
        <p className="mt-1 text-sm text-[#8A9BB5]">
          Раді знову бачити вас! Введіть дані для входу.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <InputField
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (emailErr) setEmailErr(validateEmail(v));
            if (serverError) setServerError(null);
          }}
          error={emailErr}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <div className="flex flex-col gap-1">
          <InputField
            id="login-password"
            label="Пароль"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(v) => {
              setPassword(v);
              if (passwordErr) setPasswordErr(validatePassword(v));
              if (serverError) setServerError(null);
            }}
            error={passwordErr}
            placeholder="••••••••"
            autoComplete="current-password"
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

          {/* Forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              className="mt-1 text-xs text-[#8A9BB5] transition-colors hover:text-[#F97316]"
              onClick={() =>
                alert("Функція скидання паролю буде додана незабаром.")
              }
            >
              Забули пароль?
            </button>
          </div>
        </div>

        {/* Server / API error */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 animate-fade-in"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">{serverError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          id="login-submit"
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
              Входимо…
            </>
          ) : (
            "Увійти"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#1A2C5B]" />
        <span className="text-xs text-[#8A9BB5]">або</span>
        <div className="h-px flex-1 bg-[#1A2C5B]" />
      </div>

      {/* Demo hint */}
      <div
        className="mb-4 rounded-xl border border-[#1A2C5B] px-4 py-3 text-center"
        style={{ background: "rgba(249,115,22,0.05)" }}
      >
        <p className="text-xs text-[#8A9BB5]">
          Немає акаунту?{" "}
          <Link
            href="/register"
            className="font-600 text-[#F97316] transition-opacity hover:opacity-80"
          >
            Зареєструватися безкоштовно →
          </Link>
        </p>
      </div>

      {/* Switch to register */}
      <p className="text-center text-sm text-[#8A9BB5]">
        Новий користувач?{" "}
        <Link
          href="/register"
          className="font-600 text-[#F97316] transition-opacity hover:opacity-80"
        >
          Створити акаунт
        </Link>
      </p>
    </div>
  );
}
