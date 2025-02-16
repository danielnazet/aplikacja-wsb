import { getSupabase } from './supabase';

export const auth = {
    async signIn(email, password) {
        try {
            console.log('Próba logowania:', { email });
            const supabase = getSupabase();

            // Najpierw zaloguj przez Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    throw new Error('Nieprawidłowe dane logowania');
                }
                console.error('Błąd logowania Auth:', authError);
                throw authError;
            }

            // Sprawdź czy użytkownik istnieje w tabeli users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (userError || !userData) {
                // Jeśli nie istnieje, dodaj go
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: authData.user.email,
                        first_name: authData.user.user_metadata?.first_name || '',
                        last_name: authData.user.user_metadata?.last_name || '',
                        role: authData.user.user_metadata?.role || 'worker'
                    }])
                    .select()
                    .single();

                if (insertError) {
                    console.error('Błąd dodawania użytkownika do bazy:', insertError);
                    throw insertError;
                }

                return {
                    ...authData,
                    user: newUser
                };
            }

            return {
                ...authData,
                user: userData
            };
        } catch (error) {
            console.error('Błąd logowania:', error);
            throw error;
        }
    },

    async signOut() {
        try {
            const supabase = getSupabase();
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // Dodatkowe czyszczenie po wylogowaniu
            localStorage.removeItem('supabase.auth.token');
        } catch (error) {
            console.error('Błąd wylogowania:', error);
            throw error;
        }
    },

    async getSession() {
        const supabase = getSupabase();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    }
}; 