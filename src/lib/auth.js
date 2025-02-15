import { supabase } from './supabase';

export const auth = {
    async signIn(email, password) {
        try {
            console.log('Próba logowania:', { email });

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

            // Jeśli logowanie się powiodło, pobierz dane użytkownika z tabeli users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userError) {
                console.error('Błąd pobierania danych użytkownika:', userError);
                // Wyloguj użytkownika z Auth, jeśli nie ma go w tabeli users
                await supabase.auth.signOut();
                throw new Error('Błąd pobierania danych użytkownika');
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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    }
}; 