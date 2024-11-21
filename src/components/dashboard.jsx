import React from "react";
import useAuthStore from "../lib/store";

const AdminDashboard = () => (
	<div className="p-6">
		<h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<h3 className="card-title">User Management</h3>
					<p>Manage user accounts and permissions</p>
					<div className="card-actions justify-end">
						<button className="btn btn-primary">
							Manage Users
						</button>
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
		<h2 className="text-2xl font-bold mb-4">Worker Dashboard</h2>
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
