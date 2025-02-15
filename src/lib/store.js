import { create } from 'zustand';
import { auth } from './auth';
import { supabase } from './supabase';

// Store dla autentykacji
export const useAuthStore = create((set) => ({
    user: null,
    session: null,
    loading: true,
    error: null,

    signIn: async (email, password) => {
        try {
            set({ loading: true, error: null });
            const { user, session } = await auth.signIn(email, password);
            set({ user, session, loading: false });
            return { user, session };
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    signOut: async () => {
        try {
            await auth.signOut();
            set({ user: null, session: null });
        } catch (error) {
            console.error('Błąd wylogowania:', error);
            throw error;
        }
    },

    initialize: async () => {
        try {
            const session = await auth.getSession();
            if (session) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', session.user.email)
                    .single();
                    
                set({ user: userData, session, loading: false });
            } else {
                set({ loading: false });
            }
        } catch (error) {
            console.error('Błąd inicjalizacji auth:', error);
            set({ loading: false });
        }
    }
}));

// Store dla ogólnych danych aplikacji
export const useStore = create((set) => ({
    users: [],
    setUsers: (users) => set({ users }),
    fetchUsers: async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            set({ users: data });
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
        }
    }
})); 