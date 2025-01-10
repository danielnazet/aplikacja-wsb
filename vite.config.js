import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	envDir: ".", // Obsługa zmiennych środowiskowych
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:5000", // Upewnij się, że to jest poprawny adres lokalnego serwera API
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
			"/v2/pipeline": {
				target: "http://localhost:5000", // Upewnij się, że to jest poprawny adres lokalnego serwera API
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/v2\/pipeline/, ""),
			},
		},
	},
});
