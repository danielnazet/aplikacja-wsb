-- Najpierw tworzymy funkcję do aktualizacji timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Następnie tworzymy tabelę
CREATE TABLE production_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL, -- 'morning', 'afternoon', 'night'
    planned_units INTEGER NOT NULL,
    actual_units INTEGER NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Na końcu tworzymy trigger
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON production_data
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp(); 