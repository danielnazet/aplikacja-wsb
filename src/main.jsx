import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initializeDatabase } from "./lib/db";

// Initialize database before rendering
async function init() {
	try {
		await initializeDatabase();
		const root = createRoot(document.getElementById("root"));
		root.render(
			<React.StrictMode>
				<App />
			</React.StrictMode>
		);
	} catch (error) {
		console.error("Failed to initialize application:", error);
	}
}

init();
