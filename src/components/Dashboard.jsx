import React from "react";
import { useAuthStore } from "../lib/store";
import KPISection from "./KPISection";
import MachineStatus from "./MachineStatus";
import { Link } from "react-router-dom";

const AdminDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Panel Administratora</h2>
		<KPISection />
		<MachineStatus />
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Zarządzanie Użytkownikami</h3>
					<p>Zarządzaj kontami i uprawnieniami</p>
					<div className="card-actions justify-end">
						<Link to="/employees" className="btn btn-primary">
							Zarządzaj
						</Link>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Ustawienia Systemu</h3>
					<p>Konfiguruj ustawienia systemowe</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Ustawienia</button>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Analizy</h3>
					<p>Przeglądaj raporty i analizy</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">
							Zobacz Raporty
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const ForemanDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Panel Brygadzisty</h2>
		<KPISection />
		<MachineStatus />
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Zlecenia Produkcyjne</h3>
					<p>Zarządzaj zleceniami produkcyjnymi</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Zobacz Zlecenia</button>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Zarządzanie Zespołem</h3>
					<p>Zarządzaj harmonogramem i przydziałami</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Zarządzaj Zespołem</button>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const WorkerDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Panel Pracownika</h2>
		<KPISection />
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Moje Zadania</h3>
					<p>Zobacz i aktualizuj przydzielone zadania</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Zobacz Zadania</button>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Karta Pracy</h3>
					<p>Rejestruj czas pracy</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Rejestruj Czas</button>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const Dashboard = () => {
	const user = useAuthStore((state) => state.user);

	switch (user?.role) {
		case "admin":
			return <AdminDashboard />;
		case "foreman":
			return <ForemanDashboard />;
		case "worker":
			return <WorkerDashboard />;
		default:
			return null;
	}
};

export default Dashboard;
