-- Najpierw ustawiamy schemat i uprawnienia
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- 1. Najpierw usuńmy wszystkie istniejące obiekty (w odwrotnej kolejności zależności)
DROP POLICY IF EXISTS admin_all ON public.users;
DROP POLICY IF EXISTS users_view ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP VIEW IF EXISTS public.public_users CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- 2. Utworzenie typu enum
CREATE TYPE public.user_role AS ENUM ('admin', 'foreman', 'worker');

-- 3. Utworzenie tabeli users
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'worker',
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Utworzenie widoku
CREATE VIEW public.public_users AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
FROM public.users;

-- 5. Utworzenie funkcji pomocniczych
CREATE OR REPLACE FUNCTION public.get_user_by_email(user_email TEXT)
RETURNS SETOF public.public_users AS $$
    SELECT * FROM public.public_users WHERE email = user_email;
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_workers()
RETURNS SETOF public.public_users AS $$
    SELECT * FROM public.public_users WHERE role != 'admin';
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_user(
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role public.user_role,
    p_password TEXT
)
RETURNS SETOF public.public_users AS $$
BEGIN
    RETURN QUERY
    INSERT INTO public.users (email, first_name, last_name, role, password)
    VALUES (p_email, p_first_name, p_last_name, p_role, p_password)
    RETURNING id, email, first_name, last_name, role, created_at, updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_user(
    p_user_id UUID,
    p_email TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_role public.user_role,
    p_password TEXT DEFAULT NULL
)
RETURNS SETOF public.public_users AS $$
BEGIN
    IF p_password IS NULL THEN
        RETURN QUERY
        UPDATE public.users
        SET 
            email = p_email,
            first_name = p_first_name,
            last_name = p_last_name,
            role = p_role,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id
        RETURNING id, email, first_name, last_name, role, created_at, updated_at;
    ELSE
        RETURN QUERY
        UPDATE public.users
        SET 
            email = p_email,
            first_name = p_first_name,
            last_name = p_last_name,
            role = p_role,
            password = p_password,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id
        RETURNING id, email, first_name, last_name, role, created_at, updated_at;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.users WHERE id = p_user_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Konfiguracja RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Polityka dla admina - pełny dostęp
CREATE POLICY admin_all ON public.users
    FOR ALL
    TO authenticated
    USING (true)  -- Pozwól na wszystkie operacje dla uwierzytelnionych użytkowników
    WITH CHECK (true);

-- Polityka dla INSERT - pozwól na dodawanie nowych użytkowników
CREATE POLICY users_insert ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Polityka dla SELECT - mogą widzieć podstawowe dane innych użytkowników
CREATE POLICY users_view ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

-- Polityka dla UPDATE - mogą aktualizować własne dane
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- 7. Dodanie indeksów
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- 8. Dodanie domyślnego admina
INSERT INTO public.users (id, email, first_name, last_name, role, password)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    'Admin',
    'User',
    'admin',
    'admin123'
)
ON CONFLICT (email) DO NOTHING;

-- 9. Nadanie uprawnień
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 10. Komentarze
COMMENT ON TABLE public.users IS 'Tabela przechowująca dane użytkowników systemu';
COMMENT ON COLUMN public.users.id IS 'Unikalny identyfikator użytkownika (UUID)';
COMMENT ON COLUMN public.users.email IS 'Adres email użytkownika (unikalny)';
COMMENT ON COLUMN public.users.first_name IS 'Imię użytkownika';
COMMENT ON COLUMN public.users.last_name IS 'Nazwisko użytkownika';
COMMENT ON COLUMN public.users.role IS 'Rola użytkownika w systemie';
COMMENT ON COLUMN public.users.password IS 'Hasło użytkownika (powinno być zahashowane)';
COMMENT ON COLUMN public.users.created_at IS 'Data utworzenia konta';
COMMENT ON COLUMN public.users.updated_at IS 'Data ostatniej aktualizacji danych'; 