import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { testConnection } from "./lib/db";

// Initialize database before rendering
async function init() {
	try {
		// Sprawdź połączenie z Supabase
		const isConnected = await testConnection();
		if (!isConnected) {
			throw new Error('Nie można połączyć się z bazą danych');
		}

		const root = createRoot(document.getElementById("root"));
		root.render(
			<React.StrictMode>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</React.StrictMode>
		);
	} catch (error) {
		console.error("Failed to initialize application:", error);
	}
}

init();
