-- Najpierw usuń istniejącą funkcję
drop function if exists delete_user(uuid);

-- Funkcja do bezpiecznego usuwania użytkownika
create or replace function delete_user(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    -- Sprawdź czy użytkownik ma uprawnienia
    if not exists (
        select 1 from users
        where id = auth.uid()
        and role = 'admin'
    ) then
        raise exception 'Brak uprawnień do usuwania użytkowników';
    end if;

    -- Usuń użytkownika z tabeli users
    delete from users where id = user_id;
    
    -- Usuń konto auth
    delete from auth.users where id = user_id;
end;
$$;

-- Nadaj uprawnienia do funkcji
grant execute on function delete_user to authenticated; 