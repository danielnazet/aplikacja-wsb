import "./index.css";

import Sidebar from "./components/sidebar";
import Header from "./components/header";
import Dashboard from "./components/dashboard";
import Footer from "./components/footer";

function App() {
	return (
		<div className="grid grid-cols-layout">
			<header className=" shadow col-span-2">
				<Header />
			</header>
			<aside className="bg-gray-800 text-white">
				<Sidebar />
			</aside>
			<section className="bg-gray-50 p-6">
				<Dashboard />
			</section>
			<footer className="bg-gray-100 text-center col-span-2 p-4">
				<Footer />
			</footer>
		</div>
	);
}

export default App;
