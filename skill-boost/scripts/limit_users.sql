-- =================================================================================
-- Ліміт Реєстрацій: Максимум 10 користувачів
-- Цей скрипт створює тригер, який перевіряє кількість юзерів перед кожною новою реєстрацією.
-- Запустіть його в Supabase Dashboard -> SQL Editor
-- =================================================================================

-- 1. Створюємо функцію для перевірки
CREATE OR REPLACE FUNCTION public.check_user_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INT;
BEGIN
  -- Рахуємо кількість зареєстрованих користувачів
  SELECT count(*) INTO current_count FROM auth.users;

  -- Якщо їх 10 або більше, блокуємо реєстрацію
  IF current_count >= 10 THEN
    RAISE EXCEPTION 'Досягнуто ліміт реєстрацій (максимум 10 користувачів).';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Видаляємо старий тригер якщо він був (щоб не було дублікатів)
DROP TRIGGER IF EXISTS enforce_user_limit ON auth.users;

-- 3. Вішаємо тригер на таблицю auth.users
CREATE TRIGGER enforce_user_limit
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.check_user_limit();
