import "./index.css";

import Sidebar from "./components/sidebar";
import Navbar from "./components/navbar";
import Dashboard from "./components/dashboard";
import Footer from "./components/footer";
import { useState } from "react";

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

	return (
		<div className="min-h-screen bg-base-200">
			<Navbar onToggleSidebar={toggleSidebar} />

			<div className="flex">
				<Sidebar isOpen={sidebarOpen} />

				{/* Main Content */}
				<main className="flex-1 lg:ml-[280px]">
					<Dashboard />
				</main>
			</div>
			<Footer />
		</div>
	);
}

export default App;
