import React from "react";
import { useAuthStore, useStore } from "../lib/store";
import KPISection from "./KPISection";
import MachineStatus from "./MachineStatus";
import { Link } from "react-router-dom";

// Mockowane dane KPI
const mockKPIData = {
	dailyProduction: 1250,
	productionTrend: 15,
	oeePercentage: 78,
	downtimeHours: 2.5,
	targetCompletion: 85,
	remainingUnits: 450,
	productionComparison: [
		{ label: "Pon", actual: 800, target: 1000 },
		{ label: "Wt", actual: 950, target: 1000 },
		{ label: "Śr", actual: 1100, target: 1000 },
		{ label: "Czw", actual: 920, target: 1000 },
		{ label: "Pt", actual: 1050, target: 1000 },
	],
};

// Mockowane dane maszyn
const mockMachinesData = [
	{
		id: 1,
		name: "Prasa hydrauliczna #1",
		status: "working",
		description: "Główna prasa produkcyjna - linia A",
		operator: "Jan Kowalski",
		lastService: "2024-02-15",
	},
	{
		id: 2,
		name: "Frezarka CNC #2",
		status: "service",
		description: "Frezarka do elementów precyzyjnych",
		operator: "Anna Nowak",
		lastService: "2024-03-01",
	},
	{
		id: 3,
		name: "Robot spawalniczy #1",
		status: "failure",
		description: "Robot spawalniczy - linia B",
		operator: "Piotr Wiśniewski",
		lastService: "2024-02-28",
		failureReason: "Awaria układu sterowania",
	},
	{
		id: 4,
		name: "Tokarka #3",
		status: "working",
		description: "Tokarka do elementów średnich",
		operator: "Marek Lewandowski",
		lastService: "2024-02-20",
	},
	{
		id: 5,
		name: "Giętarka #2",
		status: "working",
		description: "Giętarka do profili stalowych",
		operator: "Karolina Zielińska",
		lastService: "2024-02-25",
	},
];

const AdminDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Panel Administratora</h2>
		<KPISection data={mockKPIData} />
		<MachineStatus machines={mockMachinesData} />
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">User Management</h3>
					<p>Manage user accounts and permissions</p>
					<div className="card-actions justify-end">
						<Link to="/employees" className="btn btn-primary">
							Manage Users
						</Link>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">System Settings</h3>
					<p>Configure system-wide settings</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Settings</button>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Analytics</h3>
					<p>View system analytics and reports</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">
							View Reports
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const ForemanDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Foreman Dashboard</h2>
		<KPISection data={mockKPIData} />
		<MachineStatus machines={mockMachinesData} />
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Work Orders</h3>
					<p>Manage and assign work orders</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">View Orders</button>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Team Management</h3>
					<p>Manage worker schedules and assignments</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Manage Team</button>
					</div>
				</div>
			</div>
		</div>
	</div>
);

const WorkerDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Panel Pracownika</h2>
		<KPISection data={mockKPIData} />
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">My Tasks</h3>
					<p>View and update assigned tasks</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">View Tasks</button>
					</div>
				</div>
			</div>
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">Time Sheet</h3>
					<p>Log your work hours</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">Log Hours</button>
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
