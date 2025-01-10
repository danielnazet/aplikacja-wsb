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
		email: "user1@example.com",
		firstName: "User",
		lastName: "One",
		role: "admin",
	},
	{
		id: "2",
		email: "user2@example.com",
		firstName: "User",
		lastName: "Two",
		role: "worker",
	},
];

// Mockowane operacje bazy danych
export const dbOperations = {
	async getAllUsers() {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockUsers), 1000); // Symulacja opóźnienia
		});
	},
	// Dodaj inne operacje, jeśli potrzebne
};
