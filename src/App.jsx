import { useState } from "react";
import "./index.css";
import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";
import Dashboard from "./components/dashboard";
import LoginForm from "./components/loginForm";
import useAuthStore from "./lib/store";
import Foooter from "./components/footer";

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const user = useAuthStore((state) => state.user);

	const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

	if (!user) {
		return (
			<div className="min-h-screen bg-base-200 flex items-center justify-center">
				<LoginForm />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-base-200">
			<div className="flex flex-col h-screen">
				<Navbar onToggleSidebar={toggleSidebar} />

				<div className="flex flex-1 overflow-hidden">
					<Sidebar isOpen={sidebarOpen} />

					{/* Main Content */}
					<main className="flex-1 overflow-auto lg:ml-[280px]">
						<Dashboard />
					</main>
				</div>
				<Foooter />
			</div>
		</div>
	);
}

export default App;
