create table if not exists attendance (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references users(id) not null,
    date date default current_date not null,
    shift text not null check (shift in ('morning', 'afternoon', 'night')),
    status text not null check (status in ('present', 'absent', 'late')),
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    created_by uuid references users(id),
    unique(user_id, date, shift)
);

-- Najpierw usuń WSZYSTKIE istniejące polityki
drop policy if exists "Enable read access for all authenticated users" on attendance;
drop policy if exists "Enable insert for all users" on attendance;
drop policy if exists "Enable update for own records and admins" on attendance;
drop policy if exists "Enable delete for admins and foremen" on attendance;
drop policy if exists "Attendance is viewable by authenticated users" on attendance;
drop policy if exists "Attendance is editable by admins and foremen" on attendance;
drop policy if exists "Attendance is updatable by admins and foremen" on attendance;

-- Włącz RLS
alter table attendance enable row level security;

-- Dodaj nowe polityki
create policy "Enable read access for all authenticated users"
    on attendance for select
    to authenticated
    using (true);

create policy "Enable insert for all users"
    on attendance for insert
    to authenticated
    with check (
        auth.uid() = user_id -- Pracownik może dodać tylko swój rekord
        or exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role in ('admin', 'foreman')
        )
    );

create policy "Enable update for own records and admins"
    on attendance for update
    to authenticated
    using (
        auth.uid() = user_id -- Pracownik może aktualizować tylko swój rekord
        or exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role in ('admin', 'foreman')
        )
    );

create policy "Enable delete for admins and foremen"
    on attendance for delete
    to authenticated
    using (
        exists (
            select 1 from users
            where users.id = auth.uid()
            and users.role in ('admin', 'foreman')
        )
    ); 