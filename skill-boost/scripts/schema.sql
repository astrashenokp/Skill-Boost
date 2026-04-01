-- ═══════════════════════════════════════════════════════════════════════
-- Skill Boost — Full Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Enable UUID extension ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- ─── 1. users ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  survey_answers JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. courses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL,
  image_url    TEXT,
  "order"      INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. lessons ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lessons (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. flashcards ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flashcards (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id  UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  front      TEXT NOT NULL,
  back       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 5. quiz_questions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id     UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]',   -- array of strings
  correct_index INTEGER NOT NULL DEFAULT 0,
  explanation   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 6. user_progress ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'not_started'
               CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score        INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- ─── 7. certificates ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_url     TEXT,
  UNIQUE (user_id, course_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_lessons_course_id       ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_lesson_id    ON public.flashcards(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_course_id          ON public.quiz_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id        ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_course_id      ON public.user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id    ON public.certificates(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates   ENABLE ROW LEVEL SECURITY;

-- ─── Helper: is current user an admin? ───────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── users policies ──────────────────────────────────────────────────
-- Users can read/update their own row; admins can read all
CREATE POLICY "users: own read"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "users: own insert"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: own update"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── courses policies ─────────────────────────────────────────────────
-- Everyone (including anon) can read courses; only admins can mutate
CREATE POLICY "courses: public read"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "courses: admin insert"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "courses: admin update"
  ON public.courses FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "courses: admin delete"
  ON public.courses FOR DELETE
  USING (public.is_admin());

-- ─── lessons policies ────────────────────────────────────────────────
CREATE POLICY "lessons: public read"
  ON public.lessons FOR SELECT
  USING (true);

CREATE POLICY "lessons: admin insert"
  ON public.lessons FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "lessons: admin update"
  ON public.lessons FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "lessons: admin delete"
  ON public.lessons FOR DELETE
  USING (public.is_admin());

-- ─── flashcards policies ─────────────────────────────────────────────
CREATE POLICY "flashcards: public read"
  ON public.flashcards FOR SELECT
  USING (true);

CREATE POLICY "flashcards: admin insert"
  ON public.flashcards FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "flashcards: admin update"
  ON public.flashcards FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "flashcards: admin delete"
  ON public.flashcards FOR DELETE
  USING (public.is_admin());

-- ─── quiz_questions policies ──────────────────────────────────────────
CREATE POLICY "quiz: public read"
  ON public.quiz_questions FOR SELECT
  USING (true);

CREATE POLICY "quiz: admin insert"
  ON public.quiz_questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "quiz: admin update"
  ON public.quiz_questions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "quiz: admin delete"
  ON public.quiz_questions FOR DELETE
  USING (public.is_admin());

-- ─── user_progress policies ───────────────────────────────────────────
-- Users read/write their own; admins read all
CREATE POLICY "progress: own read"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "progress: own insert"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress: own update"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── certificates policies ────────────────────────────────────────────
-- Public read (for verification link); users can only manage own certs
CREATE POLICY "certificates: public read"
  ON public.certificates FOR SELECT
  USING (true);

CREATE POLICY "certificates: service insert"
  ON public.certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- TRIGGER: auto-create users row on auth signup
-- ═══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
