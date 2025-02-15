import { supabase, supabaseAdmin } from './supabase';

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
		try {
			const { data, error } = await supabase
				.from('public_users')
				.select('*')
				.order('created_at', { ascending: false });
				
			if (error) {
				console.error('Błąd pobierania użytkowników:', error);
				throw error;
			}

			console.log('Pobrani użytkownicy:', data);
			return data;
		} catch (error) {
			console.error('Error in getAllUsers:', error);
			throw error;
		}
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

			// 1. Najpierw utwórz konto w Auth
			const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
				email: userData.email,
				password: userData.password,
				email_confirm: true,
				user_metadata: {
					first_name: userData.firstName,
					last_name: userData.lastName,
					role: userData.role
				}
			});

			if (authError) {
				console.error('Błąd tworzenia użytkownika w Auth:', authError);
				throw authError;
			}

			// 2. Dodaj użytkownika do tabeli users
			const { data: dbUser, error: dbError } = await supabase
				.from('users')
				.upsert([{
					id: authData.user.id,
					email: userData.email,
					first_name: userData.firstName,
					last_name: userData.lastName,
					role: userData.role,
					password: userData.password
				}], { onConflict: 'id' })
				.select()
				.single();

			if (dbError) {
				console.error('Błąd dodawania użytkownika do bazy:', dbError);
				await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
				throw dbError;
			}

			console.log('Użytkownik dodany pomyślnie:', dbUser);
			return dbUser;
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

// Dodaj nową funkcję do weryfikacji użytkownika
async function verifyUser(email, password) {
	try {
		const { data, error } = await supabase
			.rpc('verify_user', {
				p_email: email,
				p_password: password
			});

		if (error) throw error;
		
		console.log('Wynik weryfikacji:', data);
		return data;
	} catch (error) {
		console.error('Błąd weryfikacji:', error);
		throw error;
	}
}

// Dodaj funkcję do eksportu
export const auth = {
	async signIn(email, password) {
		try {
			console.log('Próba logowania:', { email, password });

			// Logowanie przez Supabase Auth
			const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (authError) {
				console.error('Błąd logowania Supabase Auth:', authError);
				throw authError;
			}

			console.log('Zalogowano w Auth:', authData);

			// Pobierz dane użytkownika z naszej tabeli
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('*')
				.eq('email', email)
				.single();

			if (userError) {
				console.error('Błąd pobierania danych użytkownika:', userError);
				throw userError;
			}

			console.log('Pobrane dane użytkownika:', userData);

			// Sprawdź czy role się zgadzają
			if (userData.role !== authData.user.user_metadata.role) {
				console.warn('Różne role w Auth i bazie:', {
					authRole: authData.user.user_metadata.role,
					dbRole: userData.role
				});
			}

			const result = {
				...authData,
				user: userData
			};
			console.log('Zwracam wynik logowania:', result);
			return result;
		} catch (error) {
			console.error('Błąd logowania:', error);
			throw error;
		}
	},

	async signUp(email, password, userData) {
		try {
			// Najpierw utwórz użytkownika w Supabase Auth
			const { data: authData, error: authError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role
					}
				}
			});

			if (authError) throw authError;

			// Następnie dodaj użytkownika do naszej tabeli
			const { data: dbUser, error: dbError } = await supabase
				.from('users')
				.insert([{
					id: authData.user.id, // Użyj tego samego ID
					email: email,
					first_name: userData.firstName,
					last_name: userData.lastName,
					role: userData.role,
					password: password // Hasło będzie zahashowane przez trigger
				}])
				.select()
				.single();

			if (dbError) throw dbError;

			return {
				...authData,
				user: dbUser
			};
		} catch (error) {
			console.error('Błąd rejestracji:', error);
			throw error;
		}
	}
};

export const setupAdmin = async () => {
	try {
		// 1. Najpierw sprawdź czy admin już istnieje w Auth
		const { data: existingAuth, error: checkError } = await supabase.auth.signInWithPassword({
			email: 'admin@admin.com',
			password: 'admin123'
		});

		if (!checkError) {
			console.log('Admin już istnieje w Auth:', existingAuth);
			return { authData: existingAuth };
		}

		// Jeśli admin nie istnieje, poczekaj 2 sekundy przed próbą utworzenia
		await new Promise(resolve => setTimeout(resolve, 2000));

		// 2. Utwórz admina w Auth
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email: 'admin@admin.com',
			password: 'admin123',
			options: {
				data: {
					first_name: 'Admin',
					last_name: 'User',
					role: 'admin'
				}
			}
		});

		if (authError && authError.message !== 'User already registered') {
			console.error('Błąd tworzenia admina w Auth:', authError);
			throw authError;
		}

		console.log('Admin w Auth:', authData);

		// 3. Sprawdź czy admin istnieje w tabeli users
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('*')
			.eq('email', 'admin@admin.com')
			.single();

		console.log('Admin w tabeli users:', userData);

		if (userError) {
			console.error('Błąd sprawdzania admina w users:', userError);
		}

		return { authData, userData };
	} catch (error) {
		console.error('Błąd setupAdmin:', error);
		// Jeśli błąd dotyczy limitu czasowego, nie przerywaj inicjalizacji aplikacji
		if (error.message?.includes('security purposes')) {
			console.log('Pomijam tworzenie admina z powodu limitu czasowego');
			return null;
		}
		throw error;
	}
};
