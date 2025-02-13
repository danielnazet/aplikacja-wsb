import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Brak konfiguracji Supabase. Sprawdź zmienne środowiskowe.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funkcja testowa do sprawdzenia połączenia
export async function testConnection() {
	try {
		// Sprawdź połączenie przez pobranie liczby użytkowników
		const { data, error } = await supabase
			.from('users')
			.select('*', { count: 'exact' });
			
		if (error) {
			console.error('Błąd połączenia z Supabase:', error);
			return false;
		}
		
		console.log('Połączenie z Supabase działa poprawnie!');
		console.log(`Liczba użytkowników w bazie: ${data.length}`);
		return true;
	} catch (error) {
		console.error('Nieoczekiwany błąd:', error);
		return false;
	}
}

export const dbOperations = {
	async getAllUsers() {
		const { data, error } = await supabase
			.from('users')
			.select('*');
			
		if (error) throw error;
		return data;
	},

	async getUserByEmail(email) {
		const { data, error } = await supabase
			.rpc('get_user_by_email', { user_email: email });
			
		if (error) throw error;
		return data[0];
	},

	async addUser(userData) {
		try {
			console.log('Próba dodania użytkownika:', userData);

			// Dodaj nowego użytkownika używając funkcji RPC
			const { data, error } = await supabase
				.rpc('add_user', {
					p_email: userData.email,
					p_first_name: userData.firstName,
					p_last_name: userData.lastName,
					p_role: userData.role,
					p_password: userData.password
				});

			console.log('Wynik dodawania:', data, error);

			if (error) {
				console.error('Błąd dodawania użytkownika:', error);
				throw error;
			}

			return data;
		} catch (error) {
			console.error('Error in addUser:', error);
			throw error;
		}
	},

	async updateUser(userId, userData) {
		const { data, error } = await supabase
			.rpc('update_user', {
				p_user_id: userId,
				p_email: userData.email,
				p_first_name: userData.firstName,
				p_last_name: userData.lastName,
				p_role: userData.role,
				p_password: userData.password || null
			});
			
		if (error) throw error;
		return data[0];
	},

	async deleteUser(userId) {
		const { data, error } = await supabase
			.rpc('delete_user', { p_user_id: userId });
			
		if (error) throw error;
		return data;
	}
};
