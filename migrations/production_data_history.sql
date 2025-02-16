CREATE TABLE IF NOT EXISTS production_data_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    production_data_id UUID REFERENCES production_data(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    changes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dodaj uprawnienia
ALTER TABLE production_data_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON production_data_history;
CREATE POLICY "Enable read access for all users" ON production_data_history FOR SELECT TO authenticated USING (true);

-- Usuń istniejący trigger i funkcję
DROP TRIGGER IF EXISTS production_data_history_trigger ON production_data;
DROP FUNCTION IF EXISTS log_production_data_changes();

-- Utwórz funkcję do zapisywania historii zmian
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

-- Utwórz trigger
CREATE TRIGGER production_data_history_trigger
    AFTER INSERT OR UPDATE ON production_data
    FOR EACH ROW
    EXECUTE FUNCTION log_production_data_changes(); 