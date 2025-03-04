-- Tworzenie tabeli production_costs
CREATE TABLE IF NOT EXISTS production_costs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    production_line_id UUID REFERENCES production_lines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL,
    labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    material_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    energy_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    maintenance_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_costs DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + material_cost + energy_cost + maintenance_cost + other_costs) STORED,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeksy dla optymalizacji zapytań
CREATE INDEX IF NOT EXISTS idx_production_costs_date ON production_costs(date);
CREATE INDEX IF NOT EXISTS idx_production_costs_line ON production_costs(production_line_id);

-- Trigger do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_production_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_production_costs_timestamp
    BEFORE UPDATE ON production_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_production_costs_updated_at();

-- Uprawnienia
ALTER TABLE production_costs ENABLE ROW LEVEL SECURITY;

-- Polityki dostępu
CREATE POLICY "Admins can do everything" ON production_costs
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Foremen can view and create" ON production_costs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('foreman', 'admin')
        )
    );

CREATE POLICY "Workers can only view" ON production_costs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('worker', 'foreman', 'admin')
        )
    );

-- Komentarze do tabeli i kolumn
COMMENT ON TABLE production_costs IS 'Tabela przechowująca koszty produkcji dla linii produkcyjnych';
COMMENT ON COLUMN production_costs.labor_cost IS 'Koszt pracy (PLN)';
COMMENT ON COLUMN production_costs.material_cost IS 'Koszt materiałów (PLN)';
COMMENT ON COLUMN production_costs.energy_cost IS 'Koszt energii (PLN)';
COMMENT ON COLUMN production_costs.maintenance_cost IS 'Koszt utrzymania i serwisu (PLN)';
COMMENT ON COLUMN production_costs.other_costs IS 'Inne koszty (PLN)';
COMMENT ON COLUMN production_costs.total_cost IS 'Suma wszystkich kosztów (PLN) - obliczana automatycznie'; 