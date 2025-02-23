import { getSupabase } from '../api/supabase';

export const auth = {
    async signIn(email, password) {
        try {
            console.log('Próba logowania:', { email });
            const supabase = getSupabase();

            // Najpierw sprawdź czy użytkownik istnieje w tabeli users
            const { data: existingUser, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                console.error('Błąd sprawdzania użytkownika:', userError);
                throw userError;
            }

            // Logowanie przez Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
                options: {
                    data: {
                        role: existingUser?.role || 'worker'
                    }
                }
            });

            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    throw new Error('Nieprawidłowe dane logowania');
                }
                console.error('Błąd logowania Auth:', authError);
                throw authError;
            }

            // Pobierz dane użytkownika z naszej tabeli
            const { data: userData, error: userDataError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userDataError) {
                console.error('Błąd pobierania danych użytkownika:', userDataError);
                throw userDataError;
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