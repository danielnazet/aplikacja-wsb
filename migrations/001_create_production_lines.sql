-- Tworzenie tabeli production_lines
create table if not exists production_lines (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null unique,
    description text,
    capacity integer not null,
    status text not null default 'active',
    type text not null,
    last_maintenance timestamp with time zone,
    next_maintenance timestamp with time zone
);

-- Usuń istniejące polityki
do $$ 
begin
    -- Usuń wszystkie istniejące polityki dla production_lines
    drop policy if exists "Production lines are viewable by authenticated users" on production_lines;
    drop policy if exists "Production lines are editable by admins and foremen" on production_lines;
    drop policy if exists "Enable read access for all authenticated users" on production_lines;
    drop policy if exists "Enable read access for all users" on production_lines;
    drop policy if exists "Enable insert for admins" on production_lines;
    drop policy if exists "Enable update for admins and foremen" on production_lines;
    drop policy if exists "Enable delete for admins" on production_lines;

    -- Dodaj nowe polityki tylko jeśli nie istnieją
    if not exists (
        select 1 from pg_policies 
        where tablename = 'production_lines' 
        and policyname = 'Enable read access for all users'
    ) then
        create policy "Enable read access for all users"
            on production_lines
            for select
            using (true);
    end if;

    if not exists (
        select 1 from pg_policies 
        where tablename = 'production_lines' 
        and policyname = 'Enable insert for admins'
    ) then
        create policy "Enable insert for admins"
            on production_lines
            for insert
            to authenticated
            with check (
                auth.jwt() ->> 'role' = 'admin' or
                exists (
                    select 1 from users
                    where users.id = auth.uid()
                    and users.role = 'admin'
                )
            );
    end if;

    if not exists (
        select 1 from pg_policies 
        where tablename = 'production_lines' 
        and policyname = 'Enable update for admins and foremen'
    ) then
        create policy "Enable update for admins and foremen"
            on production_lines
            for update
            to authenticated
            using (
                auth.jwt() ->> 'role' in ('admin', 'foreman') or
                exists (
                    select 1 from users
                    where users.id = auth.uid()
                    and users.role in ('admin', 'foreman')
                )
            )
            with check (
                auth.jwt() ->> 'role' in ('admin', 'foreman') or
                exists (
                    select 1 from users
                    where users.id = auth.uid()
                    and users.role in ('admin', 'foreman')
                )
            );
    end if;

    if not exists (
        select 1 from pg_policies 
        where tablename = 'production_lines' 
        and policyname = 'Enable delete for admins'
    ) then
        create policy "Enable delete for admins"
            on production_lines
            for delete
            to authenticated
            using (
                auth.jwt() ->> 'role' = 'admin' or
                exists (
                    select 1 from users
                    where users.id = auth.uid()
                    and users.role = 'admin'
                )
            );
    end if;
end $$;

-- Włącz RLS
alter table production_lines enable row level security;

-- Dodanie referencji do production_data (jeśli kolumna nie istnieje)
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'production_data' 
        and column_name = 'production_line_id'
    ) then
        alter table production_data 
            add column production_line_id uuid references production_lines(id);
    end if;
end $$;

-- Dodanie referencji do machines (jeśli kolumna nie istnieje)
do $$
begin
    if not exists (
        select 1 from information_schema.columns 
        where table_name = 'machines' 
        and column_name = 'production_line_id'
    ) then
        alter table machines 
            add column production_line_id uuid references production_lines(id);
    end if;
end $$;

-- Indeksy
create index if not exists idx_production_lines_name on production_lines(name);
create index if not exists idx_production_lines_status on production_lines(status);
create index if not exists idx_production_lines_type on production_lines(type);

-- Dodanie funkcji do logowania zmian (jeśli nie istnieje)
create or replace function log_production_line_changes()
returns trigger as $$
begin
    insert into audit_log (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        changed_by
    ) values (
        'production_lines',
        coalesce(new.id, old.id),
        case 
            when tg_op = 'INSERT' then 'INSERT'
            when tg_op = 'UPDATE' then 'UPDATE'
            when tg_op = 'DELETE' then 'DELETE'
        end,
        case when tg_op in ('UPDATE', 'DELETE') then row_to_json(old) else null end,
        case when tg_op in ('UPDATE', 'INSERT') then row_to_json(new) else null end,
        auth.uid()
    );
    return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Dodanie triggera (jeśli nie istnieje)
do $$
begin
    if not exists (
        select 1 from information_schema.triggers 
        where trigger_name = 'production_lines_audit'
        and event_object_table = 'production_lines'
    ) then
        create trigger production_lines_audit
        after insert or update or delete on production_lines
        for each row execute function log_production_line_changes();
    end if;
end $$;

-- Dodanie funkcji do zarządzania liniami
create or replace function get_line_statistics(line_id uuid)
returns json as $$
declare
    result json;
begin
    select json_build_object(
        'total_production', coalesce(sum(actual_units), 0),
        'efficiency', case 
            when sum(planned_units) > 0 
            then (sum(actual_units)::float / sum(planned_units)::float * 100)
            else 0 
        end,
        'last_30_days_production', (
            select coalesce(sum(actual_units), 0)
            from production_data
            where production_line_id = line_id
            and date >= current_date - interval '30 days'
        )
    ) into result
    from production_data
    where production_line_id = line_id;

    return result;
end;
$$ language plpgsql security definer;

-- Dodanie widoku dla statystyk linii
create or replace view production_line_statistics as
select 
    pl.id,
    pl.name,
    pl.status,
    pl.type,
    count(distinct m.id) as machine_count,
    coalesce(sum(pd.actual_units), 0) as total_production,
    case 
        when sum(pd.planned_units) > 0 
        then (sum(pd.actual_units)::float / sum(pd.planned_units)::float * 100)
        else 0 
    end as efficiency
from production_lines pl
left join machines m on m.production_line_id = pl.id
left join production_data pd on pd.production_line_id = pl.id
group by pl.id, pl.name, pl.status, pl.type;

-- Dodanie komentarzy do tabeli
comment on table production_lines is 'Tabela przechowująca informacje o liniach produkcyjnych';
comment on column production_lines.id is 'Unikalny identyfikator linii produkcyjnej';
comment on column production_lines.name is 'Nazwa linii produkcyjnej';
comment on column production_lines.description is 'Opis linii produkcyjnej';
comment on column production_lines.capacity is 'Dzienna wydajność produkcyjna';
comment on column production_lines.status is 'Status linii (active, inactive, maintenance)';
comment on column production_lines.type is 'Typ linii produkcyjnej';

-- Tworzenie tabeli audit_log (jeśli nie istnieje)
create table if not exists audit_log (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    table_name text not null,
    record_id uuid not null,
    action text not null,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid references auth.users(id)
);

-- Dodanie indeksów dla audit_log
create index if not exists idx_audit_log_table_name on audit_log(table_name);
create index if not exists idx_audit_log_record_id on audit_log(record_id);
create index if not exists idx_audit_log_created_at on audit_log(created_at);

-- Dodanie polityk RLS dla audit_log
create policy "Audit logs are viewable by admins"
    on audit_log
    for select
    to authenticated
    using (
        auth.jwt() ->> 'role' = 'admin' or
        exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role = 'admin'
        )
    );

-- Włączenie RLS dla audit_log
alter table audit_log enable row level security; 