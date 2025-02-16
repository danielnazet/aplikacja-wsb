-- Najpierw usuń istniejącą tabelę jeśli istnieje
DROP TABLE IF EXISTS machines CASCADE;

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

-- Usuń istniejący trigger i funkcję jeśli istnieją
DROP TRIGGER IF EXISTS update_machines_updated_at ON machines;
DROP FUNCTION IF EXISTS update_machines_updated_at();

-- Utwórz funkcję triggera
CREATE OR REPLACE FUNCTION update_machines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Utwórz trigger
CREATE TRIGGER update_machines_updated_at
    BEFORE UPDATE ON machines
    FOR EACH ROW
    EXECUTE FUNCTION update_machines_updated_at();

-- Wyczyść istniejące dane
TRUNCATE TABLE machines CASCADE;

-- Wstaw początkowe dane
WITH worker_ids AS (
    SELECT id, first_name, last_name 
    FROM users 
    WHERE role = 'worker'
    LIMIT 6
)
INSERT INTO machines (name, status, description, operator_id, last_service)
SELECT
    name,
    status,
    description,
    worker_id,
    last_service::DATE
FROM (
    VALUES
        ('Linia montażowa A1', 'working', 'Główna linia montażowa - sekcja A', DATE '2024-03-10'),
        ('Robot spawalniczy R2', 'working', 'Robot spawalniczy - strefa B', DATE '2024-03-08'),
        ('Prasa hydrauliczna P3', 'service', 'Prasa do elementów wielkogabarytowych', DATE '2024-03-01'),
        ('Frezarka CNC F1', 'failure', 'Frezarka precyzyjna - dział obróbki', DATE '2024-02-28'),
        ('Tokarka T5', 'working', 'Tokarka do detali średnich', DATE '2024-03-05'),
        ('Giętarka G2', 'service', 'Giętarka do profili stalowych', DATE '2024-03-07')
    ) AS machine_data(name, status, description, last_service)
CROSS JOIN LATERAL (
    SELECT id AS worker_id
    FROM worker_ids
    ORDER BY random()
    LIMIT 1
) AS worker;

-- Dodaj przyczynę awarii dla zepsutej maszyny
UPDATE machines 
SET failure_reason = 'Awaria wrzeciona'
WHERE name = 'Frezarka CNC F1';

-- Dodaj uprawnienia
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON machines FOR SELECT TO authenticated USING (true); 