import { getSupabase, getSupabaseAdmin } from '../api/supabase';

// Funkcja testowa do sprawdzenia połączenia
export async function testConnection() {
	try {
		const supabase = getSupabase();
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
			const supabase = getSupabase();
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
		const supabase = getSupabase();
		const { data, error } = await supabase
			.rpc('get_user_by_email', { user_email: email });
			
		if (error) throw error;
		return data[0];
	},

	async addUser(userData) {
		try {
			console.log('Próba dodania użytkownika:', userData);

			// 1. Najpierw sprawdź czy użytkownik już istnieje
			const supabase = getSupabase();
			const { data: existingUser } = await supabase
				.from('users')
				.select('*')
				.eq('email', userData.email)
				.single();

			if (existingUser) {
				// Jeśli użytkownik istnieje, zaktualizuj jego dane w Auth i w bazie
				const supabaseAdmin = getSupabaseAdmin();
				await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
					email: userData.email,
					user_metadata: {
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role
					}
				});

				// Aktualizuj dane w tabeli users
				const { data: updatedUser, error: updateError } = await supabase
					.from('users')
					.update({
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role,
						updated_at: new Date().toISOString()
					})
					.eq('id', existingUser.id)
					.select()
					.single();

				if (updateError) throw updateError;
				return updatedUser;
			}

			// 2. Jeśli nie istnieje, utwórz nowego użytkownika w Auth
			const supabaseAdmin = getSupabaseAdmin();
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

			if (authError) throw authError;

			// 3. Dodaj użytkownika do tabeli users
			const { data: dbUser, error: dbError } = await supabase
				.from('users')
				.insert([{
					id: authData.user.id,
					email: userData.email,
					first_name: userData.firstName,
					last_name: userData.lastName,
					role: userData.role,
					password: userData.password
				}])
				.select()
				.single();

			if (dbError) {
				// W przypadku błędu usuń użytkownika z Auth
				await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
				throw dbError;
			}

			return dbUser;
		} catch (error) {
			console.error('Error in addUser:', error);
			throw error;
		}
	},

	async updateUser(userId, userData) {
		const supabase = getSupabase();
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
		try {
			const supabase = getSupabase();

			// 1. Najpierw usuń powiązania z maszynami
			const { error: machineError } = await supabase
				.from('machines')
				.update({ operator_id: null })
				.eq('operator_id', userId);

			if (machineError) throw machineError;

			// 2. Usuń rekordy obecności
			const { error: attendanceError } = await supabase
				.from('attendance')
				.delete()
				.eq('user_id', userId);

			if (attendanceError) throw attendanceError;

			// 3. Usuń rekordy produkcji (jeśli istnieją)
			const { error: productionError } = await supabase
				.from('production_data')
				.delete()
				.eq('created_by', userId);

			if (productionError) throw productionError;

			// 4. Teraz możemy usunąć użytkownika
			const { error: userError } = await supabase
				.rpc('delete_user', { user_id: userId });

			if (userError) throw userError;

			return true;
		} catch (error) {
			console.error('Błąd usuwania użytkownika:', error);
			throw error;
		}
	},

	async debugAuth() {
		const supabase = getSupabase();
		const { data, error } = await supabase.rpc('debug_auth');
		
		if (error) {
			console.error('Debug auth error:', error);
			return { error };
		}

		// Jeśli użytkownik jest w Auth ale nie w users, spróbuj go znaleźć po emailu
		if (data?.[0]?.user_exists === false && data?.[0]?.current_userid) {
			const authUser = await supabase.auth.getUser();
			if (authUser.data?.user) {
				// Najpierw sprawdź czy użytkownik istnieje po emailu
				const { data: existingUser } = await supabase
					.from('users')
					.select('*')
					.eq('email', authUser.data.user.email)
					.single();

				if (existingUser) {
					// Jeśli istnieje, zaktualizuj jego ID
					const { error: updateError } = await supabase
						.from('users')
						.update({ id: data[0].current_userid })
						.eq('email', authUser.data.user.email);

					if (updateError) {
						console.error('Error updating user ID:', updateError);
					} else {
						// Odśwież dane auth po aktualizacji
						return await supabase.rpc('debug_auth');
					}
				} else {
					// Jeśli nie istnieje, dodaj nowego użytkownika
					const { error: insertError } = await supabase
						.from('users')
						.insert([{
							id: data[0].current_userid,
							email: authUser.data.user.email,
							first_name: authUser.data.user.user_metadata?.first_name || 'User',
							last_name: authUser.data.user.user_metadata?.last_name || 'Name',
							role: authUser.data.user.user_metadata?.role || 'worker',
							password: ''
						}])
						.select('id, email, first_name, last_name, role');

					if (insertError) {
						console.error('Error syncing user:', insertError);
					} else {
						// Odśwież dane auth po synchronizacji
						return await supabase.rpc('debug_auth');
					}
				}
			}
		}

		return { data, error };
	},

	async addProductionData(data) {
		const supabase = getSupabase();
		const { error } = await supabase
			.from('production_data')
			.insert([{
				...data
			}]);
			
		if (error) throw error;
		return { error: null };
	},

	async getProductionData(startDate, endDate) {
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from('production_data')
			.select('*')
			.gte('date', startDate)
			.lte('date', endDate)
			.order('date', { ascending: true })
			.limit(100000);

		if (error) throw error;
		return data;
	},

	async exportProductionData(startDate, endDate) {
		const data = await this.getProductionData(startDate, endDate);
		
		// Konwertuj do CSV
		const headers = ['Data', 'Zmiana', 'Plan', 'Wykonanie', 'Typ produktu'];
		const csvContent = [
			headers.join(','),
			...data.map(row => [
				row.date,
				row.shift,
				row.planned_units,
				row.actual_units,
				row.product_type
			].join(','))
		].join('\n');

		// Utwórz i pobierz plik
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `production_data_${startDate}_${endDate}.csv`;
		link.click();
	},

	async getProductionDataHistory(startDate, endDate, page = 1, itemsPerPage = 100) {
		try {
			const supabase = getSupabase();
			// Najpierw pobierz całkowitą liczbę rekordów
			const { count } = await supabase
				.from('production_data_history')
				.select('*', { count: 'exact', head: true })
				.gte('created_at', startDate)
				.lte('created_at', endDate);

			// Następnie pobierz stronę danych
			const { data, error } = await supabase
				.from('production_data_history')
				.select(`
					*,
					user:user_id (
						first_name,
						last_name
					),
					production_data:production_data_id (*)
				`)
				.gte('created_at', startDate)
				.lte('created_at', endDate)
				.order('created_at', { ascending: false })
				.range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

			if (error) throw error;
			return { data, count };
		} catch (error) {
			console.error('Błąd pobierania historii:', error);
			throw error;
		}
	},

	async getMachines() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('machines')
				.select(`
					*,
					operator:operator_id (
						id,
						first_name,
						last_name,
						role
					)
				`)
				.order('name', { ascending: true });

			if (error) throw error;
			console.log('Pobrane maszyny:', data);
			return data;
		} catch (error) {
			console.error('Błąd pobierania maszyn:', error);
			throw error;
		}
	},

	async getWorkers() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('users')
				.select('id, first_name, last_name, role')
				.in('role', ['worker', 'foreman'])
				.order('first_name');

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Błąd pobierania pracowników:', error);
			throw error;
		}
	},

	async updateMachineOperator(machineId, operatorId) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('machines')
				.update({ 
					operator_id: operatorId || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', machineId)
				.select(`
					*,
					operator:operator_id(
						id,
						first_name,
						last_name,
						role
					)
				`)
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Błąd aktualizacji operatora:', error);
			throw error;
		}
	},

	async updateMachineStatus(machineId, status, failureReason = null) {
		const supabase = getSupabase();
		const updates = {
			status,
			updated_at: new Date().toISOString(),
			failure_reason: failureReason
		};

		if (status === 'service') {
			updates.last_service = new Date().toISOString().split('T')[0];
		}

		const { data, error } = await supabase
			.from('machines')
			.update(updates)
			.eq('id', machineId)
			.select(`
				*,
				operator:operator_id(
					id,
					first_name,
					last_name
				)
			`)
			.single();

		if (error) throw error;
		return data;
	},

	async clearFailureReason(machineId) {
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from('machines')
			.update({ failure_reason: null })
			.eq('id', machineId)
			.select(`
				*,
				operator:operator_id(
					id,
					first_name,
					last_name
				)
			`)
			.single();

		if (error) throw error;
		return data;
	},

	async getProductionLines() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('production_lines')
				.select('*')
				.order('name');
				
			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Błąd pobierania linii produkcyjnych:', error);
			throw error;
		}
	},

	async getMachinesForLine(lineId) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('machines')
				.select('*')
				.eq('production_line_id', lineId)
				.order('name');
				
			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Błąd pobierania maszyn:', error);
			throw error;
		}
	},

	async setupProductionLines() {
		try {
			const supabase = getSupabase();
			
			// Sprawdź uprawnienia
			const { data: { user }, error: authError } = await supabase.auth.getUser();
			if (authError) throw authError;

			// Pobierz aktualną rolę z tabeli users
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single();

			if (userError) throw userError;

			if (userData.role !== 'admin') {
				throw new Error('Brak uprawnień do inicjalizacji linii produkcyjnych');
			}

			const productionLines = [
				{
					name: 'Linia A',
					description: 'Główna linia montażowa',
					capacity: 1000,
					status: 'active',
					type: 'assembly'
				},
				{
					name: 'Linia B',
					description: 'Linia pakowania',
					capacity: 800,
					status: 'active',
					type: 'packaging'
				},
				{
					name: 'Linia C',
					description: 'Linia kontroli jakości',
					capacity: 500,
					status: 'active',
					type: 'quality_control'
				},
				{
					name: 'Linia D',
					description: 'Linia testowa',
					capacity: 300,
					status: 'active',
					type: 'testing'
				}
			];

			const { data, error } = await supabase
				.from('production_lines')
				.upsert(productionLines, {
					onConflict: 'name',
					returning: true
				});

			if (error) throw error;
			return data;

		} catch (error) {
			console.error('Błąd podczas tworzenia linii produkcyjnych:', error);
			throw error;
		}
	},

	async updateMachineLine(machineId, lineId) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('machines')
				.update({ 
					production_line_id: lineId || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', machineId)
				.select(`
					*,
					operator:operator_id(
						id,
						first_name,
						last_name
					),
					production_line:production_line_id(
						id,
						name
					)
				`)
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Błąd aktualizacji linii:', error);
			throw error;
		}
	},

	async getAttendance(date) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from('attendance')
				.select(`
					*,
					user:user_id (
						id,
						first_name,
						last_name,
						role
					)
				`)
				.eq('date', date);

			if (error) throw error;
			return data;
		} catch (error) {
			console.error('Błąd pobierania obecności:', error);
			throw error;
		}
	},

	async updateAttendance(userId, attendanceData) {
		try {
			const supabase = getSupabase();
			// Pobierz aktualnego użytkownika
			const { data: { user }, error: authError } = await supabase.auth.getUser();
			if (authError) throw authError;

			// Sprawdź rolę użytkownika
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single();
				
			if (userError) throw userError;

			// Pozwól pracownikowi aktualizować tylko swój własny rekord
			if (userData.role === 'worker' && userId !== user.id) {
				throw new Error('Brak uprawnień do aktualizacji obecności innych pracowników');
			}

			// Admin i brygadzista mogą aktualizować wszystkie rekordy
			// Pracownik może aktualizować tylko swój rekord
			if (['admin', 'foreman'].includes(userData.role) || userId === user.id) {
				const { data, error } = await supabase
					.from('attendance')
					.upsert({
						user_id: userId,
						date: new Date().toISOString().split('T')[0],
						shift: attendanceData.shift,
						status: attendanceData.status,
						check_in: attendanceData.checkIn,
						check_out: attendanceData.checkOut,
						notes: attendanceData.notes,
						created_by: user.id
					})
					.select()
					.single();

				if (error) {
					console.error('Błąd Supabase:', error);
					throw error;
				}
				
				return data;
			} else {
				throw new Error('Brak uprawnień do aktualizacji obecności');
			}
		} catch (error) {
			console.error('Błąd aktualizacji obecności:', error);
			throw error;
		}
	},

	async updateAttendanceRecord(recordId, attendanceData) {
		try {
			const supabase = getSupabase();
			const { data: { user }, error: authError } = await supabase.auth.getUser();
			if (authError) throw authError;

			// Najpierw pobierz rekord, żeby sprawdzić czy należy do użytkownika
			const { data: existingRecord, error: recordError } = await supabase
				.from('attendance')
				.select('user_id, shift')
				.eq('id', recordId)
				.single();

			if (recordError) throw recordError;

			// Sprawdź rolę użytkownika
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('role')
				.eq('id', user.id)
				.single();
				
			if (userError) throw userError;

			// Pozwól pracownikowi aktualizować tylko swój własny rekord
			if (userData.role === 'worker' && existingRecord.user_id !== user.id) {
				throw new Error('Brak uprawnień do aktualizacji obecności innych pracowników');
			}

			const { data, error } = await supabase
				.from('attendance')
				.update({
					status: attendanceData.status,
					check_in: attendanceData.checkIn,
					check_out: attendanceData.checkOut,
					notes: attendanceData.notes,
					shift: existingRecord.shift,
					updated_at: new Date().toISOString()
				})
				.eq('id', recordId)
				.select()
				.single();

			if (error) {
				console.error('Błąd Supabase:', error);
				throw error;
			}
			
			return data;
		} catch (error) {
			console.error('Błąd aktualizacji rekordu obecności:', error);
			throw error;
		}
	}
};

// Dodaj nową funkcję do weryfikacji użytkownika
async function verifyUser(email, password) {
	try {
		const supabase = getSupabase();
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
			const supabase = getSupabase();
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
			const supabase = getSupabase();
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
		const supabase = getSupabase();
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

// Popraw zapytanie do historii produkcji
async function getProductionHistory(startDate, endDate) {
	try {
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from('production_data_history')
			.select(`
				*,
				user:user_id (
					first_name,
					last_name
				),
				production_data (*)
			`)
			.gte('created_at', startDate)
			.lte('created_at', endDate)
			.order('created_at', { ascending: false })
			.limit(100);

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Błąd pobierania historii:', error);
		throw error;
	}
}
