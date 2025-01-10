import { useState, useEffect } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import LoginForm from "./components/LoginForm";
import { useAuthStore, useStore } from "./lib/store";
import EmployeeManagement from "./components/EmployeeManagement";
import SavingsProjects from "./components/SavingsProjects";
import TaskManagement from "./components/TaskManagement";
import Footer from "./components/footer";

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
	const [currentView, setCurrentView] = useState("dashboard");
	const { user, setUser, logout } = useAuthStore();
	const { users, fetchUsers } = useStore();

	// Fetch users on component mount and user change
	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

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
			<div className="min-h-screen bg-base-200 flex flex-col">
				<div className="flex-1 flex items-center justify-center">
					<LoginForm />
				</div>
				<Footer className="relative z-50" />
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
			case "tasks":
				return <TaskManagement />;
			default:
				return <Dashboard />;
		}
	};

	return (
		<div className="min-h-screen bg-base-200 flex flex-col">
			<Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

			<div className="flex-1 flex relative">
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
					<div className="mb-16">
						{" "}
						{/* Add margin bottom to prevent content from being hidden by footer */}
						{renderContent()}
					</div>
				</main>
			</div>

			<Footer
				className={`relative ${sidebarOpen ? "lg:ml-[0px]" : ""}`}
			/>
		</div>
	);
}

export default App;
