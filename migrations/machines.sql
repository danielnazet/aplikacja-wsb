-- Najpierw usuń istniejącą tabelę jeśli istnieje
DROP TABLE IF EXISTS machines CASCADE;

-- Utwórz tabelę machines
CREATE TABLE IF NOT EXISTS machines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('working', 'service', 'failure')),
    description TEXT,
    operator_id UUID REFERENCES users(id),
    last_service DATE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dodaj uprawnienia
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON machines;
CREATE POLICY "Enable read access for all users" ON machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable write access for authenticated users" ON machines FOR ALL TO authenticated USING (true);

-- Dodaj trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_machines_updated_at
    BEFORE UPDATE ON machines
    FOR EACH ROW
    EXECUTE FUNCTION update_machines_updated_at();

-- Wstaw przykładowe dane
INSERT INTO machines (name, status, description, last_service) VALUES
    ('Linia montażowa A1', 'working', 'Główna linia montażowa - sekcja A', CURRENT_DATE - INTERVAL '5 days'),
    ('Robot spawalniczy R2', 'working', 'Robot spawalniczy - strefa B', CURRENT_DATE - INTERVAL '7 days'),
    ('Prasa hydrauliczna P3', 'service', 'Prasa do elementów wielkogabarytowych', CURRENT_DATE - INTERVAL '14 days'),
    ('Frezarka CNC F1', 'failure', 'Frezarka precyzyjna - dział obróbki', CURRENT_DATE - INTERVAL '21 days'),
    ('Tokarka T5', 'working', 'Tokarka do detali średnich', CURRENT_DATE - INTERVAL '10 days'),
    ('Giętarka G2', 'service', 'Giętarka do profili stalowych', CURRENT_DATE - INTERVAL '8 days');

-- Dodaj przyczynę awarii dla zepsutej maszyny
UPDATE machines 
SET failure_reason = 'Awaria wrzeciona'
WHERE name = 'Frezarka CNC F1';

-- Przypisz losowych operatorów do maszyn (jeśli są jacyś pracownicy w bazie)
WITH workers AS (
    SELECT id FROM users WHERE role = 'worker'
)
UPDATE machines m
SET operator_id = (
    SELECT id 
    FROM workers 
    ORDER BY random() 
    LIMIT 1
)
WHERE EXISTS (SELECT 1 FROM workers); 