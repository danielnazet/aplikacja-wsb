import { useState, useEffect } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import LoginForm from "./components/LoginForm";
import useAuthStore from "./lib/store";
import EmployeeManagement from "./components/EmployeeManagement";
import SavingsProjects from "./components/SavingsProjects";

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
	const [currentView, setCurrentView] = useState("dashboard");
	const user = useAuthStore((state) => state.user);

	// Handle browser back button
	useEffect(() => {
		const handlePopState = () => {
			if (user) {
				setCurrentView("dashboard");
			}
		};

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [user]);

	// Handle screen resize
	useEffect(() => {
		const handleResize = () => {
			setSidebarOpen(window.innerWidth >= 1024);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	if (!user) {
		return (
			<div className="min-h-screen bg-base-200 flex items-center justify-center">
				<LoginForm />
			</div>
		);
	}

	const renderContent = () => {
		switch (currentView) {
			case "employees":
				return user.role === "admin" ? (
					<EmployeeManagement />
				) : (
					<Dashboard />
				);
			case "savings":
				return <SavingsProjects />;
			default:
				return <Dashboard />;
		}
	};

	return (
		<div className="min-h-screen bg-base-200">
			<Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

			<div className="flex">
				<Sidebar
					isOpen={sidebarOpen}
					onNavigate={setCurrentView}
					currentView={currentView}
				/>

				<main
					className={`flex-1 p-4 transition-all duration-300 ${
						sidebarOpen ? "lg:ml-[280px]" : ""
					}`}
				>
					{renderContent()}
				</main>
			</div>
		</div>
	);
}

export default App;
