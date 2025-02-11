import { createClient } from "@libsql/client";

// Użyj lokalnego URL
const DB_URL = "http://localhost:5000";
const DB_AUTH_TOKEN = ""; // Jeśli nie potrzebujesz tokena, pozostaw puste

if (!DB_URL) {
	throw new Error(
		"Database configuration missing. Please check your configuration."
	);
}

// Create database client
const client = createClient({
	url: DB_URL,
	authToken: DB_AUTH_TOKEN,
});

export const dbOperations = {
	async getAllUsers() {
		try {
			const result = await client.execute('SELECT * FROM users');
			return result.rows;
		} catch (error) {
			console.error("Database error:", error);
			throw error;
		}
	},

	async getUserByEmail(email) {
		try {
			const result = await client.execute({
				sql: 'SELECT * FROM users WHERE email = ?',
				args: [email]
			});
			return result.rows[0];
		} catch (error) {
			console.error("Database error:", error);
			throw error;
		}
	},

	async addUser(userData) {
		try {
			const result = await client.execute({
				sql: `
					INSERT INTO users (email, firstName, lastName, role, password)
					VALUES (?, ?, ?, ?, ?)
				`,
				args: [
					userData.email,
					userData.firstName,
					userData.lastName,
					userData.role,
					userData.password // W prawdziwej aplikacji hasło powinno być zahashowane!
				]
			});
			
			// Pobierz dodanego użytkownika
			const newUser = await this.getUserByEmail(userData.email);
			return newUser;
		} catch (error) {
			console.error("Database error:", error);
			throw error;
		}
	},

	async updateUser(userId, userData) {
		try {
			let sql = 'UPDATE users SET ';
			const args = [];
			const updates = [];

			// Dynamicznie buduj zapytanie na podstawie przekazanych danych
			if (userData.email) {
				updates.push('email = ?');
				args.push(userData.email);
			}
			if (userData.firstName) {
				updates.push('firstName = ?');
				args.push(userData.firstName);
			}
			if (userData.lastName) {
				updates.push('lastName = ?');
				args.push(userData.lastName);
			}
			if (userData.role) {
				updates.push('role = ?');
				args.push(userData.role);
			}
			if (userData.password) {
				updates.push('password = ?');
				args.push(userData.password); // W prawdziwej aplikacji hasło powinno być zahashowane!
			}

			sql += updates.join(', ');
			sql += ' WHERE id = ?';
			args.push(userId);

			await client.execute({
				sql,
				args
			});

			// Pobierz zaktualizowanego użytkownika
			const result = await client.execute({
				sql: 'SELECT * FROM users WHERE id = ?',
				args: [userId]
			});
			return result.rows[0];
		} catch (error) {
			console.error("Database error:", error);
			throw error;
		}
	},

	async deleteUser(userId) {
		try {
			await client.execute({
				sql: 'DELETE FROM users WHERE id = ?',
				args: [userId]
			});
			return true;
		} catch (error) {
			console.error("Database error:", error);
			throw error;
		}
	},
};
