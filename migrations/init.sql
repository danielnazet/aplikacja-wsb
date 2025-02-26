-- Najpierw ustawiamy schemat i uprawnienia
CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Dodaj rozszerzenie pgcrypto jeśli nie istnieje
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Utworzenie typu enum
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'foreman', 'worker');

-- 2. Utworzenie tabeli users
DROP TABLE IF EXISTS public.users CASCADE;
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

-- 3. Utworzenie widoku 
CREATE OR REPLACE VIEW public.public_users AS
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
FROM public.users;

-- 4. Utworzenie funkcji pomocniczych
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
    VALUES (
        p_email, 
        p_first_name, 
        p_last_name, 
        p_role, 
        crypt(p_password, gen_salt('bf')) -- Hashowanie hasła
    )
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
            password = crypt(p_password, gen_salt('bf')),
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

-- 5. Konfiguracja RLS i polityk
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Dodaj polityki
CREATE POLICY admin_all ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY users_insert ON public.users
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY users_view ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY anon_access ON public.users
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- 6. Dodanie indeksów
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 7. Dodanie domyślnego admina
INSERT INTO public.users (email, first_name, last_name, role, password)
VALUES (
    'admin@admin.com',
    'Admin',
    'User',
    'admin',
    crypt('Admin123!@#', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;

-- 8. Nadanie uprawnień
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 9. Funkcja do weryfikacji hasła
CREATE OR REPLACE FUNCTION public.verify_user(
    p_email TEXT,
    p_password TEXT
)
RETURNS public.users AS $$
    SELECT *
    FROM public.users
    WHERE email = p_email 
    AND password = crypt(p_password, password);
$$ LANGUAGE sql SECURITY DEFINER;

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