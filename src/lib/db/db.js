import { getSupabase, getSupabaseAdmin } from "../api/supabase";

// Funkcja testowa do sprawdzenia połączenia
export async function testConnection() {
	try {
		const supabase = getSupabase();
		// Sprawdź połączenie przez pobranie liczby użytkowników
		const { data, error } = await supabase
			.from("users")
			.select("*", { count: "exact" });

		if (error) {
			console.error("Błąd połączenia z Supabase:", error);
			return false;
		}

		console.log("Połączenie z Supabase działa poprawnie!");
		console.log(`Liczba użytkowników w bazie: ${data.length}`);
		return true;
	} catch (error) {
		console.error("Nieoczekiwany błąd:", error);
		return false;
	}
}

// Główny obiekt z operacjami bazodanowymi
const dbOperations = {
	async getAllUsers() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("public_users")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				console.error("Błąd pobierania użytkowników:", error);
				throw error;
			}

			console.log("Pobrani użytkownicy:", data);
			return data;
		} catch (error) {
			console.error("Error in getAllUsers:", error);
			throw error;
		}
	},

	async getUserByEmail(email) {
		const supabase = getSupabase();
		const { data, error } = await supabase.rpc("get_user_by_email", {
			user_email: email,
		});

		if (error) throw error;
		return data[0];
	},

	async addUser(userData) {
		try {
			console.log("Próba dodania użytkownika:", userData);

			// 1. Najpierw sprawdź czy użytkownik już istnieje
			const supabase = getSupabase();
			const { data: existingUser } = await supabase
				.from("users")
				.select("*")
				.eq("email", userData.email)
				.single();

			if (existingUser) {
				// Jeśli użytkownik istnieje, zaktualizuj jego dane w Auth i w bazie
				const supabaseAdmin = getSupabaseAdmin();
				await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
					email: userData.email,
					user_metadata: {
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role,
					},
				});

				// Aktualizuj dane w tabeli users
				const { data: updatedUser, error: updateError } = await supabase
					.from("users")
					.update({
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role,
						updated_at: new Date().toISOString(),
					})
					.eq("id", existingUser.id)
					.select()
					.single();

				if (updateError) throw updateError;
				return updatedUser;
			}

			// 2. Jeśli nie istnieje, utwórz nowego użytkownika w Auth
			const supabaseAdmin = getSupabaseAdmin();
			const { data: authData, error: authError } =
				await supabaseAdmin.auth.admin.createUser({
					email: userData.email,
					password: userData.password,
					email_confirm: true,
					user_metadata: {
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role,
					},
				});

			if (authError) throw authError;

			// 3. Dodaj użytkownika do tabeli users
			const { data: dbUser, error: dbError } = await supabase
				.from("users")
				.insert([
					{
						id: authData.user.id,
						email: userData.email,
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role,
						password: userData.password,
					},
				])
				.select()
				.single();

			if (dbError) {
				// W przypadku błędu usuń użytkownika z Auth
				await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
				throw dbError;
			}

			return dbUser;
		} catch (error) {
			console.error("Error in addUser:", error);
			throw error;
		}
	},

	async updateUser(userId, userData) {
		const supabase = getSupabase();
		const { data, error } = await supabase.rpc("update_user", {
			p_user_id: userId,
			p_email: userData.email,
			p_first_name: userData.firstName,
			p_last_name: userData.lastName,
			p_role: userData.role,
			p_password: userData.password || null,
		});

		if (error) throw error;
		return data[0];
	},

	async deleteUser(userId) {
		try {
			const supabase = getSupabase();

			// 1. Najpierw usuń powiązania z maszynami
			const { error: machineError } = await supabase
				.from("machines")
				.update({ operator_id: null })
				.eq("operator_id", userId);

			if (machineError) throw machineError;

			// 2. Usuń rekordy obecności
			const { error: attendanceError } = await supabase
				.from("attendance")
				.delete()
				.eq("user_id", userId);

			if (attendanceError) throw attendanceError;

			// 3. Usuń rekordy produkcji (jeśli istnieją)
			const { error: productionError } = await supabase
				.from("production_data")
				.delete()
				.eq("created_by", userId);

			if (productionError) throw productionError;

			// 4. Teraz możemy usunąć użytkownika
			const { error: userError } = await supabase.rpc("delete_user", {
				user_id: userId,
			});

			if (userError) throw userError;

			return true;
		} catch (error) {
			console.error("Błąd usuwania użytkownika:", error);
			throw error;
		}
	},

	async debugAuth() {
		const supabase = getSupabase();
		const { data, error } = await supabase.rpc("debug_auth");

		if (error) {
			console.error("Debug auth error:", error);
			return { error };
		}

		// Jeśli użytkownik jest w Auth ale nie w users, spróbuj go znaleźć po emailu
		if (data?.[0]?.user_exists === false && data?.[0]?.current_userid) {
			const authUser = await supabase.auth.getUser();
			if (authUser.data?.user) {
				// Najpierw sprawdź czy użytkownik istnieje po emailu
				const { data: existingUser } = await supabase
					.from("users")
					.select("*")
					.eq("email", authUser.data.user.email)
					.single();

				if (existingUser) {
					// Jeśli istnieje, zaktualizuj jego ID
					const { error: updateError } = await supabase
						.from("users")
						.update({ id: data[0].current_userid })
						.eq("email", authUser.data.user.email);

					if (updateError) {
						console.error("Error updating user ID:", updateError);
					} else {
						// Odśwież dane auth po aktualizacji
						return await supabase.rpc("debug_auth");
					}
				} else {
					// Jeśli nie istnieje, dodaj nowego użytkownika
					const { error: insertError } = await supabase
						.from("users")
						.insert([
							{
								id: data[0].current_userid,
								email: authUser.data.user.email,
								first_name:
									authUser.data.user.user_metadata
										?.first_name || "User",
								last_name:
									authUser.data.user.user_metadata
										?.last_name || "Name",
								role:
									authUser.data.user.user_metadata?.role ||
									"worker",
								password: "",
							},
						])
						.select("id, email, first_name, last_name, role");

					if (insertError) {
						console.error("Error syncing user:", insertError);
					} else {
						// Odśwież dane auth po synchronizacji
						return await supabase.rpc("debug_auth");
					}
				}
			}
		}

		return { data, error };
	},

	async addProductionData(data) {
		const supabase = getSupabase();
		const { error } = await supabase.from("production_data").insert([
			{
				...data,
			},
		]);

		if (error) throw error;
		return { error: null };
	},

	async getProductionData(startDate, endDate) {
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from("production_data")
			.select("*")
			.gte("date", startDate)
			.lte("date", endDate)
			.order("date", { ascending: true })
			.limit(100000);

		if (error) throw error;
		return data;
	},

	async exportProductionData(startDate, endDate) {
		const data = await this.getProductionData(startDate, endDate);

		// Konwertuj do CSV
		const headers = ["Data", "Zmiana", "Plan", "Wykonanie", "Typ produktu"];
		const csvContent = [
			headers.join(","),
			...data.map((row) =>
				[
					row.date,
					row.shift,
					row.planned_units,
					row.actual_units,
					row.product_type,
				].join(",")
			),
		].join("\n");

		// Utwórz i pobierz plik
		const blob = new Blob([csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `production_data_${startDate}_${endDate}.csv`;
		link.click();
	},

	async getProductionDataHistory(
		startDate,
		endDate,
		page = 1,
		itemsPerPage = 100
	) {
		try {
			const supabase = getSupabase();
			// Najpierw pobierz całkowitą liczbę rekordów
			const { count } = await supabase
				.from("production_data_history")
				.select("*", { count: "exact", head: true })
				.gte("created_at", startDate)
				.lte("created_at", endDate);

			// Następnie pobierz stronę danych
			const { data, error } = await supabase
				.from("production_data_history")
				.select(
					`
					*,
					user:user_id (
						first_name,
						last_name
					),
					production_data:production_data_id (*)
				`
				)
				.gte("created_at", startDate)
				.lte("created_at", endDate)
				.order("created_at", { ascending: false })
				.range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

			if (error) throw error;
			return { data, count };
		} catch (error) {
			console.error("Błąd pobierania historii:", error);
			throw error;
		}
	},

	async getMachines() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("machines")
				.select(
					`
					*,
					operator:operator_id (
						id,
						first_name,
						last_name,
						role
					)
				`
				)
				.order("name", { ascending: true });

			if (error) throw error;
			console.log("Pobrane maszyny:", data);
			return data;
		} catch (error) {
			console.error("Błąd pobierania maszyn:", error);
			throw error;
		}
	},

	async getWorkers() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("users")
				.select("id, first_name, last_name, role")
				.in("role", ["worker", "foreman"])
				.order("first_name");

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Błąd pobierania pracowników:", error);
			throw error;
		}
	},

	async updateMachineOperator(machineId, operatorId) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("machines")
				.update({
					operator_id: operatorId || null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", machineId)
				.select(
					`
					*,
					operator:operator_id(
						id,
						first_name,
						last_name,
						role
					)
				`
				)
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Błąd aktualizacji operatora:", error);
			throw error;
		}
	},

	async updateMachineStatus(machineId, status, failureReason = null) {
		const supabase = getSupabase();
		const updates = {
			status,
			updated_at: new Date().toISOString(),
			failure_reason: failureReason,
		};

		if (status === "service") {
			updates.last_service = new Date().toISOString().split("T")[0];
		}

		// Pobierz aktualny stan maszyny, aby sprawdzić czy zmienił się status
		const { data: currentMachine, error: fetchError } = await supabase
			.from("machines")
			.select("status, production_line_id")
			.eq("id", machineId)
			.single();
			
		if (fetchError) throw fetchError;
		
		// Aktualizuj status maszyny
		const { data, error } = await supabase
			.from("machines")
			.update(updates)
			.eq("id", machineId)
			.select(
				`
				*,
				operator:operator_id(
					id,
					first_name,
					last_name
				)
			`
			)
			.single();

		if (error) throw error;
		
		// Jeśli maszyna jest przypisana do linii produkcyjnej i zmienił się status na awarię lub serwis
		// lub z awarii/serwisu na działającą, zaktualizuj dane produkcyjne
		if (data.production_line_id && 
			((status === "failure" || status === "service") && currentMachine.status === "working") || 
			(status === "working" && (currentMachine.status === "failure" || currentMachine.status === "service"))) {
			
			try {
				await this.updateProductionDataForMachineStatusChange(data.production_line_id, status);
			} catch (prodError) {
				console.error("Błąd aktualizacji danych produkcyjnych:", prodError);
				// Nie przerywamy głównej operacji, jeśli aktualizacja danych produkcyjnych się nie powiedzie
			}
		}
		
		return data;
	},
	
	// Nowa funkcja do aktualizacji danych produkcyjnych po zmianie statusu maszyny
	async updateProductionDataForMachineStatusChange(lineId, machineStatus) {
		const supabase = getSupabase();
		const today = new Date().toISOString().split("T")[0];
		
		// Pobierz dzisiejsze dane produkcyjne dla linii
		const { data: productionData, error: fetchError } = await supabase
			.from("production_data")
			.select("*")
			.eq("production_line_id", lineId)
			.eq("date", today);
			
		if (fetchError) throw fetchError;
		
		// Jeśli nie ma danych produkcyjnych na dziś, nie ma co aktualizować
		if (!productionData || productionData.length === 0) return;
		
		// Pobierz informacje o linii produkcyjnej
		const { data: lineData, error: lineError } = await supabase
			.from("production_lines")
			.select("*")
			.eq("id", lineId)
			.single();
			
		if (lineError) throw lineError;
		
		// Pobierz wszystkie maszyny przypisane do tej linii
		const { data: machines, error: machinesError } = await supabase
			.from("machines")
			.select("id, status")
			.eq("production_line_id", lineId);
			
		if (machinesError) throw machinesError;
		
		// Oblicz procent sprawnych maszyn na linii
		const totalMachines = machines.length;
		const workingMachines = machines.filter(m => m.status === "working").length;
		const workingPercentage = totalMachines > 0 ? workingMachines / totalMachines : 1;
		
		// Aktualizuj dane produkcyjne dla każdego rekordu z dzisiaj
		for (const record of productionData) {
			// Jeśli maszyna przechodzi w stan awarii/serwisu, zmniejsz actual_units
			// Jeśli maszyna wraca do pracy, zwiększ actual_units (ale nie więcej niż planned_units)
			let newActualUnits;
			
			if (machineStatus === "failure" || machineStatus === "service") {
				// Zmniejsz actual_units proporcjonalnie do liczby działających maszyn
				newActualUnits = Math.floor(record.actual_units * workingPercentage);
			} else if (machineStatus === "working") {
				// Zwiększ actual_units, ale nie więcej niż planned_units
				const maxIncrease = Math.min(
					record.planned_units - record.actual_units,
					Math.floor(record.planned_units / totalMachines)
				);
				newActualUnits = Math.min(record.planned_units, record.actual_units + maxIncrease);
			} else {
				continue; // Jeśli status jest inny, nie zmieniaj danych produkcyjnych
			}
			
			// Aktualizuj rekord w bazie danych
			const { error: updateError } = await supabase
				.from("production_data")
				.update({
					actual_units: newActualUnits,
					updated_at: new Date().toISOString()
				})
				.eq("id", record.id);
				
			if (updateError) {
				console.error(`Błąd aktualizacji danych produkcyjnych dla rekordu ${record.id}:`, updateError);
			}
		}
	},

	async uploadFailureImage(file, machineId) {
		try {
			const supabase = getSupabase();
			
			// Sprawdź, czy plik istnieje
			if (!file) {
				console.error('Brak pliku do przesłania');
				throw new Error('Brak pliku do przesłania');
			}
			
			// Sprawdź, czy bucket istnieje
			const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
			
			if (bucketsError) {
				console.error('Błąd podczas sprawdzania bucketów:', bucketsError);
				// Jeśli jest problem z bucketami, użyj alternatywnej metody
				return this.uploadFailureImageAsBase64(file);
			}
			
			// Sprawdź, czy bucket 'machine_failures' istnieje
			const bucketExists = buckets.some(bucket => bucket.name === 'machine_failures');
			
			// Jeśli bucket nie istnieje, użyj alternatywnej metody Base64
			// Nie próbujemy tworzyć bucketu, bo to wymaga uprawnień administratora
			if (!bucketExists) {
				console.log('Bucket machine_failures nie istnieje, używam metody Base64');
				return this.uploadFailureImageAsBase64(file);
			}
			
			// Przygotuj nazwę pliku
			const fileExt = file.name.split('.').pop();
			const fileName = `${machineId}_${Date.now()}.${fileExt}`;
			const filePath = `failure_images/${fileName}`;
			
			// Prześlij plik
			const { data, error } = await supabase.storage
				.from('machine_failures')
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: true // Zmieniono na true, aby nadpisać istniejący plik
				});

			if (error) {
				console.error('Błąd podczas przesyłania pliku:', error);
				// Jeśli jest problem z przesyłaniem pliku, użyj alternatywnej metody
				return this.uploadFailureImageAsBase64(file);
			}

			// Pobierz publiczny URL do zdjęcia
			const { data: urlData } = supabase.storage
				.from('machine_failures')
				.getPublicUrl(filePath);

			if (!urlData || !urlData.publicUrl) {
				console.error('Nie udało się uzyskać publicznego URL dla zdjęcia');
				// Jeśli jest problem z uzyskaniem URL, użyj alternatywnej metody
				return this.uploadFailureImageAsBase64(file);
			}

			console.log('Zdjęcie przesłane pomyślnie:', urlData.publicUrl);
			return urlData.publicUrl;
		} catch (error) {
			console.error('Błąd przesyłania zdjęcia:', error);
			// W przypadku jakiegokolwiek błędu, użyj alternatywnej metody
			return this.uploadFailureImageAsBase64(file);
		}
	},
	
	// Alternatywna metoda przesyłania zdjęć jako Base64
	async uploadFailureImageAsBase64(file) {
		return new Promise((resolve, reject) => {
			try {
				const reader = new FileReader();
				
				reader.onloadend = () => {
					// Sprawdź, czy plik został poprawnie odczytany
					if (reader.result) {
						console.log('Zdjęcie zakodowane jako Base64');
						resolve(reader.result);
					} else {
						reject(new Error('Nie udało się odczytać pliku jako Base64'));
					}
				};
				
				reader.onerror = () => {
					reject(new Error('Błąd podczas odczytywania pliku jako Base64'));
				};
				
				// Odczytaj plik jako URL danych (Base64)
				reader.readAsDataURL(file);
			} catch (error) {
				console.error('Błąd podczas kodowania zdjęcia jako Base64:', error);
				reject(error);
			}
		});
	},

	async clearFailureReason(machineId) {
		const supabase = getSupabase();
		const { data, error } = await supabase
			.from("machines")
			.update({ failure_reason: null })
			.eq("id", machineId)
			.select(
				`
				*,
				operator:operator_id(
					id,
					first_name,
					last_name
				)
			`
			)
			.single();

		if (error) throw error;
		return data;
	},

	async getProductionLines() {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("production_lines")
				.select("*")
				.order("name");

			if (error) {
				console.error("Błąd pobierania linii produkcyjnych:", error);
				return [];
			}
			
			return data || [];
		} catch (error) {
			console.error("Błąd pobierania linii produkcyjnych:", error);
			return [];
		}
	},

	async getMachinesForLine(lineId) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("machines")
				.select("*")
				.eq("production_line_id", lineId)
				.order("name");

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Błąd pobierania maszyn:", error);
			throw error;
		}
	},

	async setupProductionLines() {
		try {
			const supabase = getSupabase();

			// Sprawdź uprawnienia
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			// Pobierz aktualną rolę z tabeli users
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", user.id)
				.single();

			if (userError) throw userError;

			if (userData.role !== "admin") {
				throw new Error(
					"Brak uprawnień do inicjalizacji linii produkcyjnych"
				);
			}

			const productionLines = [
				{
					name: "Linia A",
					description: "Główna linia montażowa",
					capacity: 1000,
					status: "active",
					type: "assembly",
				},
				{
					name: "Linia B",
					description: "Linia pakowania",
					capacity: 800,
					status: "active",
					type: "packaging",
				},
				{
					name: "Linia C",
					description: "Linia kontroli jakości",
					capacity: 500,
					status: "active",
					type: "quality_control",
				},
				{
					name: "Linia D",
					description: "Linia testowa",
					capacity: 300,
					status: "active",
					type: "testing",
				},
			];

			const { data, error } = await supabase
				.from("production_lines")
				.upsert(productionLines, {
					onConflict: "name",
					returning: true,
				});

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Błąd podczas tworzenia linii produkcyjnych:", error);
			throw error;
		}
	},

	async updateMachineLine(machineId, lineId) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("machines")
				.update({
					production_line_id: lineId || null,
					updated_at: new Date().toISOString(),
				})
				.eq("id", machineId)
				.select(
					`
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
				`
				)
				.single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Błąd aktualizacji linii:", error);
			throw error;
		}
	},

	async getAttendance(date) {
		try {
			const supabase = getSupabase();
			const { data, error } = await supabase
				.from("attendance")
				.select(
					`
					*,
					user:user_id (
						id,
						first_name,
						last_name,
						role
					)
				`
				)
				.eq("date", date);

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Błąd pobierania obecności:", error);
			throw error;
		}
	},

	async updateAttendance(userId, attendanceData) {
		try {
			const supabase = getSupabase();
			// Pobierz aktualnego użytkownika
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			// Sprawdź rolę użytkownika
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", user.id)
				.single();

			if (userError) throw userError;

			// Pozwól pracownikowi aktualizować tylko swój własny rekord
			if (userData.role === "worker" && userId !== user.id) {
				throw new Error(
					"Brak uprawnień do aktualizacji obecności innych pracowników"
				);
			}

			// Admin i brygadzista mogą aktualizować wszystkie rekordy
			// Pracownik może aktualizować tylko swój rekord
			if (
				["admin", "foreman"].includes(userData.role) ||
				userId === user.id
			) {
				const { data, error } = await supabase
					.from("attendance")
					.upsert({
						user_id: userId,
						date: new Date().toISOString().split("T")[0],
						shift: attendanceData.shift,
						status: attendanceData.status,
						check_in: attendanceData.checkIn,
						check_out: attendanceData.checkOut,
						notes: attendanceData.notes,
						created_by: user.id,
					})
					.select()
					.single();

				if (error) {
					console.error("Błąd Supabase:", error);
					throw error;
				}

				return data;
			} else {
				throw new Error("Brak uprawnień do aktualizacji obecności");
			}
		} catch (error) {
			console.error("Błąd aktualizacji obecności:", error);
			throw error;
		}
	},

	async updateAttendanceRecord(recordId, attendanceData) {
		try {
			const supabase = getSupabase();
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError) throw authError;

			// Najpierw pobierz rekord, żeby sprawdzić czy należy do użytkownika
			const { data: existingRecord, error: recordError } = await supabase
				.from("attendance")
				.select("user_id, shift")
				.eq("id", recordId)
				.single();

			if (recordError) throw recordError;

			// Sprawdź rolę użytkownika
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("role")
				.eq("id", user.id)
				.single();

			if (userError) throw userError;

			// Pozwól pracownikowi aktualizować tylko swój własny rekord
			if (
				userData.role === "worker" &&
				existingRecord.user_id !== user.id
			) {
				throw new Error(
					"Brak uprawnień do aktualizacji obecności innych pracowników"
				);
			}

			const { data, error } = await supabase
				.from("attendance")
				.update({
					status: attendanceData.status,
					check_in: attendanceData.checkIn,
					check_out: attendanceData.checkOut,
					notes: attendanceData.notes,
					shift: existingRecord.shift,
					updated_at: new Date().toISOString(),
				})
				.eq("id", recordId)
				.select()
				.single();

			if (error) {
				console.error("Błąd Supabase:", error);
				throw error;
			}

			return data;
		} catch (error) {
			console.error("Błąd aktualizacji rekordu obecności:", error);
			throw error;
		}
	},

	async createProductionLine(data) {
		try {
			const supabase = getSupabase();
			const { data: result, error } = await supabase.rpc(
				"create_production_line",
				{
					p_name: data.name,
					p_description: data.description,
					p_capacity: data.capacity,
					p_status: data.status,
					p_type: data.type,
				}
			);

			if (error) throw error;
			return result;
		} catch (error) {
			console.error("Błąd tworzenia linii produkcyjnej:", error);
			throw error;
		}
	},

	async updateProductionLine(id, data) {
		try {
			const supabase = getSupabase();
			const { error } = await supabase.rpc("update_production_line", {
				p_id: id,
				p_name: data.name,
				p_description: data.description,
				p_capacity: data.capacity,
				p_status: data.status,
				p_type: data.type,
			});

			if (error) throw error;
			return { success: true };
		} catch (error) {
			console.error("Błąd aktualizacji linii produkcyjnej:", error);
			throw error;
		}
	},

	async deleteProductionLine(id) {
		try {
			const supabase = getSupabase();
			const { error } = await supabase.rpc("delete_production_line", {
				p_id: id,
			});

			if (error) throw error;
			return { success: true };
		} catch (error) {
			console.error("Błąd usuwania linii produkcyjnej:", error);
			throw error;
		}
	},

	async getProductionDataForLine(lineId) {
		try {
			const supabase = getSupabase();
			const today = new Date().toISOString().split("T")[0]; // Pobierz dzisiejszą datę w formacie YYYY-MM-DD
			const { data, error } = await supabase
				.from("production_data")
				.select("*")
				.eq("production_line_id", lineId)
				.eq("date", today) // Dodaj filtr dla dzisiejszej daty
				.order("date", { ascending: false });

			if (error) {
				console.error("Błąd pobierania danych produkcyjnych:", error);
				return []; // Zwróć pustą tablicę w przypadku błędu
			}
			
			return data || []; // Zwróć dane lub pustą tablicę, jeśli data jest null/undefined
		} catch (error) {
			console.error(
				"Błąd pobierania danych produkcyjnych dla linii:",
				error
			);
			return []; // Zwróć pustą tablicę w przypadku wyjątku
		}
	},

	// Funkcje analityczne
	async getAnalyticsData(startDate, endDate) {
		try {
			const supabase = getSupabase();
			
			// Pobierz dane produkcyjne
			const productionData = await supabase
				.from('production_data')
				.select('*')
				.gte('date', startDate)
				.lte('date', endDate);

			// Pobierz dane jakościowe
			const qualityData = await supabase
				.from('quality_data')
				.select('*')
				.gte('date', startDate)
				.lte('date', endDate);

			// Pobierz dane o kosztach
			const costData = await supabase
				.from('production_costs')
				.select('*')
				.gte('date', startDate)
				.lte('date', endDate);

			// Oblicz wskaźniki
			const summary = this.calculateAnalyticsSummary(productionData, qualityData, costData);
			const trends = this.calculateTrends(productionData, qualityData);
			const losses = this.analyzeLosses(productionData, qualityData);

			// Przygotuj dane do wykresów
			const financial = {
				revenueHistory: productionData?.data?.map(record => ({
					date: record.date,
					revenue: record.actual_units * 100,
					costs: record.actual_units * 60
				})) || [],
				costStructure: [
					{ name: 'Materiały', value: 40 },
					{ name: 'Praca', value: 30 },
					{ name: 'Energia', value: 20 },
					{ name: 'Inne', value: 10 }
				]
			};

			return {
				summary,
				trends,
				losses,
				financial
			};
		} catch (error) {
			console.error('Błąd podczas pobierania danych analitycznych:', error);
			throw error;
		}
	},

	calculateAnalyticsSummary(productionData, qualityData, costData) {
		try {
			const summary = {
				revenue: 0,
				costs: 0,
				margin: 0,
				roi: 0,
				revenueGrowth: 0,
				costsReduction: 0,
				marginTarget: 25,
				roiGrowth: 0
			};

			if (productionData?.data) {
				summary.revenue = productionData.data.reduce((acc, record) => {
					const unitPrice = 100;
					return acc + (record.actual_units * unitPrice);
				}, 0);
			}

			if (costData?.data) {
				summary.costs = costData.data.reduce((acc, record) => {
					return acc + record.total_cost;
				}, 0);
			}

			if (summary.revenue > 0) {
				summary.margin = ((summary.revenue - summary.costs) / summary.revenue) * 100;
			}

			if (summary.costs > 0) {
				summary.roi = ((summary.revenue - summary.costs) / summary.costs) * 100;
			}

			return summary;
		} catch (error) {
			console.error('Błąd podczas obliczania podsumowania:', error);
			return null;
		}
	},

	calculateTrends(productionData, qualityData) {
		try {
			return {
				productionForecast: [
					{ date: '2024-03', actual: 1000, forecast: 1200 },
					{ date: '2024-04', actual: null, forecast: 1300 },
					{ date: '2024-05', actual: null, forecast: 1400 }
				],
				kpiTrends: [
					{ date: '2024-03', efficiency: 85, quality: 98, utilization: 90 },
					{ date: '2024-04', efficiency: 87, quality: 99, utilization: 92 },
					{ date: '2024-05', efficiency: 90, quality: 99, utilization: 95 }
				]
			};
		} catch (error) {
			console.error('Błąd podczas obliczania trendów:', error);
			return null;
		}
	},

	analyzeLosses(productionData, qualityData) {
		try {
			return {
				downtimeReasons: [
					{ reason: 'Awaria maszyny', hours: 12 },
					{ reason: 'Brak materiałów', hours: 8 },
					{ reason: 'Przestój planowany', hours: 6 }
				],
				defectReasons: [
					{ reason: 'Wada materiału', count: 45 },
					{ reason: 'Błąd operatora', count: 30 },
					{ reason: 'Usterka maszyny', count: 25 }
				]
			};
		} catch (error) {
			console.error('Błąd podczas analizy strat:', error);
			return null;
		}
	},

	calculateForecast(historicalData) {
		try {
			return {
				production: [
					{ date: '2024-03', value: 1200 },
					{ date: '2024-04', value: 1300 },
					{ date: '2024-05', value: 1400 }
				],
				accuracy: 0.85
			};
		} catch (error) {
			console.error('Błąd podczas obliczania prognozy:', error);
			return null;
		}
	},

	// Funkcje jakościowe
	async createQualityReport(lineId, data) {
		try {
			const supabase = getSupabase();
			const today = new Date().toISOString().split("T")[0];
			
			const { data: existingReports, error: checkError } = await supabase
				.from("quality_data")
				.select("id")
				.eq("production_line_id", lineId)
				.eq("date", today)
				.eq("shift", data.shift);
				
			if (checkError) throw checkError;
			
			if (existingReports?.length > 0) {
				const { error: updateError } = await supabase
					.from("quality_data")
					.update({
						ok_count: data.okCount,
						nok_count: data.nokCount,
						nok_reasons: data.nokReasons,
						inspector: data.inspector,
						notes: data.notes,
						updated_at: new Date().toISOString()
					})
					.eq("id", existingReports[0].id);
					
				if (updateError) throw updateError;
				return { id: existingReports[0].id, updated: true };
			}
			
			const { data: newReport, error: insertError } = await supabase
				.from("quality_data")
				.insert({
					production_line_id: lineId,
					date: today,
					shift: data.shift,
					ok_count: data.okCount,
					nok_count: data.nokCount,
					nok_reasons: data.nokReasons,
					inspector: data.inspector,
					notes: data.notes,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				})
				.select();
				
			if (insertError) throw insertError;
			return { id: newReport[0].id, updated: false };
		} catch (error) {
			console.error("Błąd podczas tworzenia raportu jakości:", error);
			throw error;
		}
	},

	async getQualityDataForLine(lineId, date = null) {
		try {
			const supabase = getSupabase();
			const targetDate = date || new Date().toISOString().split("T")[0];
			
			const { data, error } = await supabase
				.from("quality_data")
				.select("*")
				.eq("production_line_id", lineId)
				.eq("date", targetDate);
				
			if (error) throw error;
			return data || [];
		} catch (error) {
			console.error("Błąd podczas pobierania danych jakościowych:", error);
			return null;
		}
	},

	async calculateQualityMetrics(lineId, startDate, endDate) {
		try {
			const supabase = getSupabase();
			
			const { data, error } = await supabase
				.from("quality_data")
				.select("*")
				.eq("production_line_id", lineId)
				.gte("date", startDate)
				.lte("date", endDate);
				
			if (error) throw error;
			
			if (!data?.length) {
				return {
					totalOk: 0,
					totalNok: 0,
					defectRate: 0,
					commonDefects: []
				};
			}
			
			const totalOk = data.reduce((sum, record) => sum + (record.ok_count || 0), 0);
			const totalNok = data.reduce((sum, record) => sum + (record.nok_count || 0), 0);
			const defectRate = totalOk + totalNok > 0 ? (totalNok / (totalOk + totalNok)) * 100 : 0;
			
			const defectCounts = {};
			data.forEach(record => {
				if (record.nok_reasons?.length) {
					record.nok_reasons.forEach(reason => {
						const defectName = reason.reason || "Nieznany";
						defectCounts[defectName] = (defectCounts[defectName] || 0) + (reason.count || 0);
					});
				}
			});
			
			const commonDefects = Object.entries(defectCounts)
				.map(([reason, count]) => ({ reason, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5);
			
			return {
				totalOk,
				totalNok,
				defectRate: parseFloat(defectRate.toFixed(2)),
				commonDefects
			};
		} catch (error) {
			console.error("Błąd podczas obliczania metryk jakości:", error);
			return null;
		}
	},

	async generateQualityControlPlan(lineId, productionData) {
		try {
			// Generowanie podstawowego planu kontroli jakości
			const controlPoints = [];
			const totalUnits = productionData.planned_units || 100;
			const checkpoints = Math.ceil(totalUnits / 50); // Kontrola co 50 sztuk
			
			for (let i = 0; i < checkpoints; i++) {
				controlPoints.push({
					unit_number: (i + 1) * 50,
					parameters: [{
						name: "Wymiar krytyczny",
						unit: "mm",
						nominal: 100,
						tolerance: 5
					}]
				});
			}
			
			return {
				production_line_id: lineId,
				product_type: productionData.product_type,
				date: productionData.date,
				shift: productionData.shift,
				control_points: controlPoints
			};
		} catch (error) {
			console.error("Błąd podczas generowania planu kontroli jakości:", error);
			return null;
		}
	},

	async updateProductionData(id, data) {
		try {
			const supabase = getSupabase();
			const { error } = await supabase
				.from('production_data')
				.update({
					date: data.date,
					shift: data.shift,
					planned_units: data.planned_units,
					actual_units: data.actual_units,
					product_type: data.product_type,
					production_line_id: data.production_line_id,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) throw error;
			return { error: null };
		} catch (error) {
			console.error('Błąd podczas aktualizacji danych produkcyjnych:', error);
			return { error };
		}
	},

	async deleteProductionData(id) {
		try {
			const supabase = getSupabase();
			const { error } = await supabase
				.from('production_data')
				.delete()
				.eq('id', id);

			if (error) throw error;
			return { error: null };
		} catch (error) {
			console.error('Błąd podczas usuwania danych produkcyjnych:', error);
			return { error };
		}
	}
};

// Dodaj funkcję do eksportu
export const auth = {
	async signIn(email, password) {
		try {
			console.log("Próba logowania:", { email, password });

			// Logowanie przez Supabase Auth
			const supabase = getSupabase();
			const { data: authData, error: authError } =
				await supabase.auth.signInWithPassword({
					email,
					password,
				});

			if (authError) {
				console.error("Błąd logowania Supabase Auth:", authError);
				throw authError;
			}

			console.log("Zalogowano w Auth:", authData);

			// Pobierz dane użytkownika z naszej tabeli
			const { data: userData, error: userError } = await supabase
				.from("users")
				.select("*")
				.eq("email", email)
				.single();

			if (userError) {
				console.error("Błąd pobierania danych użytkownika:", userError);
				throw userError;
			}

			console.log("Pobrane dane użytkownika:", userData);

			// Sprawdź czy role się zgadzają
			if (userData.role !== authData.user.user_metadata.role) {
				console.warn("Różne role w Auth i bazie:", {
					authRole: authData.user.user_metadata.role,
					dbRole: userData.role,
				});
			}

			const result = {
				...authData,
				user: userData,
			};
			console.log("Zwracam wynik logowania:", result);
			return result;
		} catch (error) {
			console.error("Błąd logowania:", error);
			throw error;
		}
	},

	async signUp(email, password, userData) {
		try {
			// Najpierw utwórz użytkownika w Supabase Auth
			const supabase = getSupabase();
			const { data: authData, error: authError } =
				await supabase.auth.signUp({
					email,
					password,
					options: {
						data: {
							first_name: userData.firstName,
							last_name: userData.lastName,
							role: userData.role,
						},
					},
				});

			if (authError) throw authError;

			// Następnie dodaj użytkownika do naszej tabeli
			const { data: dbUser, error: dbError } = await supabase
				.from("users")
				.insert([
					{
						id: authData.user.id, // Użyj tego samego ID
						email: email,
						first_name: userData.firstName,
						last_name: userData.lastName,
						role: userData.role,
						password: password, // Hasło będzie zahashowane przez trigger
					},
				])
				.select()
				.single();

			if (dbError) throw dbError;

			return {
				...authData,
				user: dbUser,
			};
		} catch (error) {
			console.error("Błąd rejestracji:", error);
			throw error;
		}
	},
};

export const setupAdmin = async () => {
	try {
		// 1. Najpierw sprawdź czy admin już istnieje w Auth
		const supabase = getSupabase();
		const { data: existingAuth, error: checkError } =
			await supabase.auth.signInWithPassword({
				email: "admin@admin.com",
				password: "admin123",
			});

		if (!checkError) {
			console.log("Admin już istnieje w Auth:", existingAuth);
			return { authData: existingAuth };
		}

		// Jeśli admin nie istnieje, poczekaj 2 sekundy przed próbą utworzenia
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// 2. Utwórz admina w Auth
		const { data: authData, error: authError } = await supabase.auth.signUp(
			{
				email: "admin@admin.com",
				password: "admin123",
				options: {
					data: {
						first_name: "Admin",
						last_name: "User",
						role: "admin",
					},
				},
			}
		);

		if (authError && authError.message !== "User already registered") {
			console.error("Błąd tworzenia admina w Auth:", authError);
			throw authError;
		}

		console.log("Admin w Auth:", authData);

		// 3. Sprawdź czy admin istnieje w tabeli users
		const { data: userData, error: userError } = await supabase
			.from("users")
			.select("*")
			.eq("email", "admin@admin.com")
			.single();

		console.log("Admin w tabeli users:", userData);

		if (userError) {
			console.error("Błąd sprawdzania admina w users:", userError);
		}

		return { authData, userData };
	} catch (error) {
		console.error("Błąd setupAdmin:", error);
		// Jeśli błąd dotyczy limitu czasowego, nie przerywaj inicjalizacji aplikacji
		if (error.message?.includes("security purposes")) {
			console.log("Pomijam tworzenie admina z powodu limitu czasowego");
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
			.from("production_data_history")
			.select(
				`
				*,
				user:user_id (
					first_name,
					last_name
				),
				production_data (*)
			`
			)
			.gte("created_at", startDate)
			.lte("created_at", endDate)
			.order("created_at", { ascending: false })
			.limit(100);

		if (error) throw error;
		return data;
	} catch (error) {
		console.error("Błąd pobierania historii:", error);
		throw error;
	}
}

export { dbOperations };
