CREATE TABLE production_data_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    production_data_id UUID REFERENCES production_data(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete'
    changes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger do zapisywania historii zmian
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

CREATE TRIGGER production_data_history_trigger
    AFTER INSERT OR UPDATE ON production_data
    FOR EACH ROW
    EXECUTE FUNCTION log_production_data_changes(); 