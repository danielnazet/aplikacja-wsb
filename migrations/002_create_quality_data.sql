-- Tworzenie tabeli quality_data
create table if not exists quality_data (
    id uuid primary key default uuid_generate_v4(),
    production_line_id uuid references production_lines(id) on delete cascade,
    date date not null,
    shift text not null check (shift in ('morning', 'afternoon', 'night')),
    product text not null,
    product_code text,
    ok_count integer not null default 0,
    nok_count integer not null default 0,
    nok_reasons jsonb[] not null default '{}',
    defect_images text[],
    inspector text not null,
    notes text,
    status text not null default 'completed' check (status in ('pending', 'in_progress', 'completed')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Indeksy
create index if not exists idx_quality_data_production_line_id on quality_data(production_line_id);
create index if not exists idx_quality_data_date on quality_data(date);

-- Trigger do aktualizacji updated_at
create or replace function update_quality_data_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger quality_data_updated_at
    before update on quality_data
    for each row
    execute function update_quality_data_updated_at();

-- Uprawnienia
grant all on quality_data to authenticated; 