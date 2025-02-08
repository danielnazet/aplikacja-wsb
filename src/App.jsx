import { useState, useEffect } from "react";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import LoginForm from "./components/loginForm";
import { useAuthStore, useStore } from "./lib/store";
import EmployeeManagement from "./components/EmployeeManagement";
import SavingsProjects from "./components/SavingsProjects";
import TaskManagement from "./components/TaskManagement";
import Footer from "./components/footer";
import KPISection from "./components/KPISection";
import MachineStatus from "./components/MachineStatus";
import ProductionSchedule from "./components/ProductionSchedule";
import EmployeeAttendance from "./components/EmployeeAttendance";
import AlertSystem from "./components/AlertSystem";
import QualityTracking from "./components/QualityTracking";
import AnalyticsModule from "./components/AnalyticsModule";

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
	// ... reszta danych maszyn ...
];

// Mockowane dane harmonogramu produkcji
const mockScheduleData = [
	{
		id: 1,
		time: "07:00",
		product: "Wspornik typu A",
		productCode: "WSP-001",
		quantity: 100,
		completed: 65,
		line: "Linia A",
		status: "in_progress"
	},
	{
		id: 2,
		time: "09:30",
		product: "Zawias przemysłowy",
		productCode: "ZAW-123",
		quantity: 200,
		completed: 200,
		line: "Linia B",
		status: "completed"
	},
	{
		id: 3,
		time: "11:00",
		product: "Obudowa silnika",
		productCode: "OBD-445",
		quantity: 50,
		completed: 10,
		line: "Linia C",
		status: "delayed"
	},
	{
		id: 4,
		time: "14:00",
		product: "Wspornik typu B",
		productCode: "WSP-002",
		quantity: 150,
		completed: 0,
		line: "Linia A",
		status: "planned"
	}
];

// Mockowane dane obecności
const mockAttendanceData = [
	{
		id: 1,
		name: "Jan Kowalski",
		position: "Operator maszyny",
		shift: "morning",
		checkIn: "6:05",
		checkOut: "14:00",
		status: "present",
		hoursWorked: "7:55",
		notes: ""
	},
	{
		id: 2,
		name: "Anna Nowak",
		position: "Kontroler jakości",
		shift: "morning",
		checkIn: "6:15",
		checkOut: null,
		status: "late",
		hoursWorked: null,
		notes: "Spóźnienie - problemy komunikacyjne"
	},
	{
		id: 3,
		name: "Piotr Wiśniewski",
		position: "Technik utrzymania ruchu",
		shift: "morning",
		checkIn: null,
		checkOut: null,
		status: "absent",
		hoursWorked: null,
		notes: "Urlop"
	},
	{
		id: 4,
		name: "Karolina Zielińska",
		position: "Operator wózka",
		shift: "morning",
		checkIn: "5:55",
		checkOut: "14:00",
		status: "present",
		hoursWorked: "8:05",
		notes: ""
	}
];

// Mockowane dane alertów
const initialAlerts = [
	{
		id: 1,
		title: "Krytyczny poziom surowca",
		message: "Stal nierdzewna 304 - pozostało 50kg (minimum: 200kg)",
		priority: "critical",
		timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minut temu
	},
	{
		id: 2,
		title: "Opóźnienie w produkcji",
		message: "Linia A - opóźnienie 45 minut w realizacji zamówienia #2024/03/15",
		priority: "warning",
		timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minut temu
	},
	{
		id: 3,
		title: "Przekroczony czas przestoju",
		message: "Maszyna: Prasa hydrauliczna #1 - przestój ponad 2 godziny",
		priority: "critical",
		timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minut temu
	},
	{
		id: 4,
		title: "Zbliżający się przegląd",
		message: "Zaplanowany przegląd Frezarki CNC #2 za 2 dni",
		priority: "warning",
		timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 godzina temu
	},
];

// Mockowane dane jakości
const mockQualityData = {
	summary: {
		totalOk: 2850,
		totalNok: 45,
	},
	reports: [
		{
			id: 1,
			shift: "Ranna (6:00 - 14:00)",
			product: "Wspornik typu A",
			productCode: "WSP-001",
			okCount: 950,
			nokCount: 12,
			nokReasons: [
				{ reason: "Wymiary poza tolerancją", count: 8 },
				{ reason: "Wada powierzchni", count: 4 }
			],
			operator: "Jan Kowalski",
			status: "completed"
		},
		{
			id: 2,
			shift: "Ranna (6:00 - 14:00)",
			product: "Zawias przemysłowy",
			productCode: "ZAW-123",
			okCount: 1900,
			nokCount: 33,
			nokReasons: [
				{ reason: "Błąd montażu", count: 20 },
				{ reason: "Wada materiału", count: 13 }
			],
			operator: "Anna Nowak",
			status: "in_progress"
		}
	],
	controls: [
		{
			id: 1,
			time: "07:15",
			stage: "Obróbka wstępna",
			product: "Wspornik typu A",
			productCode: "WSP-001",
			parameter: "Grubość powłoki",
			value: "2.8",
			unit: "mm",
			limit: "3.0 ±0.3 mm",
			result: "pass",
			inspector: "Marek Nowak"
		},
		{
			id: 2,
			time: "08:30",
			stage: "Kontrola końcowa",
			product: "Zawias przemysłowy",
			productCode: "ZAW-123",
			parameter: "Wytrzymałość",
			value: "850",
			unit: "N",
			limit: "min. 900 N",
			result: "fail",
			inspector: "Karolina Kowalska"
		}
	]
};

// Mockowane dane analityczne
const mockAnalyticsData = {
	summary: {
		revenue: 1250000,
		revenueGrowth: 15,
		costs: 875000,
		costsReduction: 8,
		margin: 30,
		marginTarget: 35,
		roi: 25,
		roiGrowth: 5
	},
	financial: {
		revenueHistory: [
			{ date: '2024-01', revenue: 1000000, costs: 700000 },
			{ date: '2024-02', revenue: 1100000, costs: 750000 },
			{ date: '2024-03', revenue: 1250000, costs: 875000 },
		],
		costStructure: [
			{ name: 'Materiały', value: 450000 },
			{ name: 'Robocizna', value: 250000 },
			{ name: 'Energia', value: 100000 },
			{ name: 'Inne', value: 75000 },
		]
	},
	trends: {
		productionForecast: [
			{ date: '2024-Q1', actual: 10000, forecast: null },
			{ date: '2024-Q2', actual: 12000, forecast: null },
			{ date: '2024-Q3', actual: null, forecast: 15000 },
			{ date: '2024-Q4', actual: null, forecast: 18000 },
		],
		kpiTrends: [
			{ date: '2024-01', efficiency: 85, quality: 98, utilization: 75 },
			{ date: '2024-02', efficiency: 87, quality: 97, utilization: 78 },
			{ date: '2024-03', efficiency: 90, quality: 99, utilization: 82 },
		]
	},
	losses: {
		downtimeReasons: [
			{ reason: 'Awarie', hours: 24 },
			{ reason: 'Przezbrojenia', hours: 16 },
			{ reason: 'Brak materiałów', hours: 8 },
			{ reason: 'Planowane przeglądy', hours: 12 },
		],
		defectReasons: [
			{ reason: 'Wymiary', count: 150 },
			{ reason: 'Powierzchnia', count: 80 },
			{ reason: 'Montaż', count: 60 },
			{ reason: 'Materiał', count: 40 },
		]
	}
};

function App() {
	const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
	const [currentView, setCurrentView] = useState("dashboard");
	const { user, setUser, logout } = useAuthStore();
	const { users, fetchUsers } = useStore();
	const [alerts, setAlerts] = useState(initialAlerts);

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
			case "kpi":
				return (
					<div className="p-6">
						<h2 className="text-2xl font-bold mb-4">KPI Dashboard</h2>
						<KPISection data={mockKPIData} />
					</div>
				);
			case "machines":
				return (
					<div className="p-6">
						<h2 className="text-2xl font-bold mb-4">Stan Maszyn</h2>
						<MachineStatus machines={mockMachinesData} />
					</div>
				);
			case "schedule":
				return (
					<div className="p-6">
						<h2 className="text-2xl font-bold mb-4">Harmonogram Produkcji</h2>
						<ProductionSchedule scheduleData={mockScheduleData} />
					</div>
				);
			case "attendance":
				return (
					<div className="p-6">
						<h2 className="text-2xl font-bold mb-4">Monitorowanie Pracowników</h2>
						<EmployeeAttendance attendanceData={mockAttendanceData} />
					</div>
				);
			case "quality":
				return (
					<div className="p-6">
						<h2 className="text-2xl font-bold mb-4">Śledzenie Jakości</h2>
						<QualityTracking qualityData={mockQualityData} />
					</div>
				);
			case "analytics":
				return (
					<div className="p-6">
						<h2 className="text-2xl font-bold mb-4">Analizy i Raporty</h2>
						<AnalyticsModule analyticsData={mockAnalyticsData} />
					</div>
				);
			default:
				return <Dashboard />;
		}
	};

	const handleDismissAlert = (alertId) => {
		setAlerts(alerts.filter(alert => alert.id !== alertId));
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

				<AlertSystem 
					alerts={alerts}
					onDismiss={handleDismissAlert}
				/>
			</div>

			<Footer
				className={`relative ${sidebarOpen ? "lg:ml-[0px]" : ""}`}
			/>
		</div>
	);
}

export default App;
