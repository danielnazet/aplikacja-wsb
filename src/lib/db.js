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

// Mockowane dane użytkowników
const mockUsers = [
	{
		id: "1",
		email: "admin@example.com",
		firstName: "User",
		lastName: "One",
		role: "admin",
		password: "admin123",
	},
	{
		id: "2",
		email: "worker@example.com",
		firstName: "User",
		lastName: "Two",
		role: "worker",
		password: "worker123",
	},
	{
		id: "3",
		email: "foreman@example.com",
		firstName: "User",
		lastName: "Three",
		role: "foreman",
		password: "foreman123",

	},
];

// Mockowane operacje bazy danych
export const dbOperations = {
	async getAllUsers() {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockUsers), 1000); // Symulacja opóźnienia
		});
	},
	async getUserByEmail(email) {
		return new Promise((resolve) => {
			const user = mockUsers.find((user) => user.email === email);
			setTimeout(() => resolve(user), 1000); // Symulacja opóźnienia
		});
	},
};
