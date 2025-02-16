-- Najpierw usuń istniejące tabele
DROP TABLE IF EXISTS production_data_history CASCADE;
DROP TABLE IF EXISTS production_data CASCADE;

-- Utwórz tabelę production_data
CREATE TABLE IF NOT EXISTS production_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
    planned_units INTEGER NOT NULL,
    actual_units INTEGER NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dodaj uprawnienia
ALTER TABLE production_data ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki
DROP POLICY IF EXISTS "Enable read access for all users" ON production_data;
DROP POLICY IF EXISTS "Enable update for creators" ON production_data;
DROP POLICY IF EXISTS "Enable delete for admins" ON production_data;

-- Dodaj nowe polityki
-- Wszyscy zalogowani mogą czytać
CREATE POLICY "Enable read access for all users" 
    ON production_data FOR SELECT 
    TO authenticated 
    USING (true);

-- Pracownicy i admini mogą dodawać dane
CREATE POLICY "Enable insert for workers and admins" 
    ON production_data FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid 
            AND u.role IN ('worker', 'admin')
            AND u.id = created_by
        )
    );

-- Tylko twórca wpisu i admin mogą go modyfikować
CREATE POLICY "Enable update for creators and admins" 
    ON production_data FOR UPDATE 
    TO authenticated 
    USING (
        created_by = auth.uid()::uuid OR 
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid 
            AND u.role = 'admin'
        )
    );

-- Tylko admin może usuwać
CREATE POLICY "Enable delete for admins" 
    ON production_data FOR DELETE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid 
            AND u.role = 'admin'
        )
    );

-- Utwórz tabelę production_data_history
CREATE TABLE IF NOT EXISTS production_data_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    production_data_id UUID REFERENCES production_data(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dodaj uprawnienia dla historii
ALTER TABLE production_data_history ENABLE ROW LEVEL SECURITY;

-- Usuń istniejące polityki
DROP POLICY IF EXISTS "Enable read access for all users" ON production_data_history;
DROP POLICY IF EXISTS "Enable insert for trigger" ON production_data_history;

-- Dodaj polityki dla historii
CREATE POLICY "Enable read access for all users" 
    ON production_data_history 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Dodaj politykę umożliwiającą dodawanie wpisów przez trigger
CREATE POLICY "Enable insert for trigger" 
    ON production_data_history 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);  -- Pozwól na wszystkie inserty, bo są wykonywane przez trigger

-- Dodaj politykę dla aktualizacji (opcjonalnie)
CREATE POLICY "Enable update for admins" 
    ON production_data_history 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid 
            AND u.role = 'admin'
        )
    );

-- Utwórz trigger do zapisywania historii
CREATE OR REPLACE FUNCTION log_production_data_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO production_data_history (
            production_data_id,
            user_id,
            action,
            changes
        ) VALUES (
            NEW.id,
            NEW.created_by,
            'create',
            row_to_json(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO production_data_history (
            production_data_id,
            user_id,
            action,
            changes
        ) VALUES (
            NEW.id,
            NEW.created_by,
            'update',
            jsonb_build_object(
                'old', row_to_json(OLD),
                'new', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Dodaj trigger
DROP TRIGGER IF EXISTS production_data_history_trigger ON production_data;
CREATE TRIGGER production_data_history_trigger
    AFTER INSERT OR UPDATE ON production_data
    FOR EACH ROW
    EXECUTE FUNCTION log_production_data_changes();

-- Dodaj indeksy dla lepszej wydajności
CREATE INDEX IF NOT EXISTS idx_production_data_date ON production_data(date);
CREATE INDEX IF NOT EXISTS idx_production_data_history_created_at ON production_data_history(created_at);
CREATE INDEX IF NOT EXISTS idx_production_data_history_production_data_id ON production_data_history(production_data_id);
CREATE INDEX IF NOT EXISTS idx_production_data_history_user_id ON production_data_history(user_id);

-- Najpierw usuń starą funkcję
DROP FUNCTION IF EXISTS debug_auth();

-- Dodaj funkcję pomocniczą do debugowania
CREATE OR REPLACE FUNCTION debug_auth() 
RETURNS TABLE (
    current_username text,
    current_userid uuid,
    current_userrole text,
    user_exists boolean,
    user_role text,
    user_email text,
    auth_valid boolean,
    policy_check boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CAST(current_user AS text),
        auth.uid()::uuid,
        CAST(auth.role() AS text),
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid
        ),
        (
            SELECT role::text
            FROM users u 
            WHERE u.id = auth.uid()::uuid
        ),
        (
            SELECT email
            FROM users u 
            WHERE u.id = auth.uid()::uuid
        ),
        auth.role() = 'authenticated',
        EXISTS (
            SELECT 1 
            FROM users u 
            WHERE u.id = auth.uid()::uuid 
            AND u.role IN ('worker', 'admin')
        );
END;
$$; 