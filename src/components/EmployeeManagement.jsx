import React, { useState, useEffect } from "react";
import { useAuthStore, useStore } from "../lib/store";
import { dbOperations } from "../lib/db";
import { toast } from "react-hot-toast";
import AddEmployeeModal from './AddEmployeeModal';

export default function EmployeeManagement() {
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterRole, setFilterRole] = useState('all');

	useEffect(() => {
		fetchEmployees();
	}, []);

	const fetchEmployees = async () => {
		try {
			setLoading(true);
			const data = await dbOperations.getAllUsers();
			setEmployees(data);
		} catch (error) {
			console.error('Błąd pobierania pracowników:', error);
			toast.error('Nie udało się pobrać listy pracowników');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id) => {
		if (window.confirm('Czy na pewno chcesz usunąć tego pracownika?')) {
			try {
				await dbOperations.deleteUser(id);
				toast.success('Pracownik został usunięty');
				fetchEmployees();
			} catch (error) {
				console.error('Błąd usuwania pracownika:', error);
				toast.error('Nie udało się usunąć pracownika');
			}
		}
	};

	const getRoleBadgeColor = (role) => {
		switch (role) {
			case 'admin': return 'badge-primary';
			case 'foreman': return 'badge-secondary';
			case 'worker': return 'badge-accent';
			default: return 'badge-ghost';
		}
	};

	const getRoleTranslation = (role) => {
		switch (role) {
			case 'admin': return 'Administrator';
			case 'foreman': return 'Brygadzista';
			case 'worker': return 'Pracownik';
			default: return role;
		}
	};

	const filteredEmployees = employees
		.filter(emp => 
			(emp.first_name + ' ' + emp.last_name + ' ' + emp.email)
				.toLowerCase()
				.includes(searchTerm.toLowerCase())
		)
		.filter(emp => filterRole === 'all' || emp.role === filterRole);

	return (
		<div className="space-y-6">
			{/* Nagłówek z wyszukiwarką i filtrowaniem */}
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<h2 className="card-title">Zarządzanie Pracownikami</h2>
						<button
							className="btn btn-primary"
							onClick={() => setShowAddModal(true)}
						>
							Dodaj Pracownika
						</button>
					</div>
					
					<div className="flex flex-col md:flex-row gap-4 mt-4">
						<div className="form-control flex-1">
							<div className="input-group">
								<input
									type="text"
									placeholder="Szukaj pracownika..."
									className="input input-bordered w-full"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
								/>
								<button className="btn btn-square">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</button>
							</div>
						</div>
						
						<select
							className="select select-bordered w-full md:w-auto"
							value={filterRole}
							onChange={(e) => setFilterRole(e.target.value)}
						>
							<option value="all">Wszystkie role</option>
							<option value="admin">Administratorzy</option>
							<option value="foreman">Brygadziści</option>
							<option value="worker">Pracownicy</option>
						</select>
					</div>
				</div>
			</div>

			{/* Lista pracowników */}
			<div className="card bg-base-100 shadow-xl">
				<div className="card-body">
					{loading ? (
						<div className="flex justify-center items-center h-40">
							<span className="loading loading-spinner loading-lg"></span>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{filteredEmployees.map(employee => (
								<div key={employee.id} className="card bg-base-200">
									<div className="card-body p-4">
										<div className="flex justify-between items-start">
											<div>
												<h3 className="font-bold text-lg">
													{employee.first_name} {employee.last_name}
												</h3>
												<p className="text-sm opacity-70">{employee.email}</p>
											</div>
											<div className={`badge ${getRoleBadgeColor(employee.role)}`}>
												{getRoleTranslation(employee.role)}
											</div>
										</div>
										
										<div className="card-actions justify-end mt-4">
											<button
												className="btn btn-sm btn-ghost"
												onClick={() => setEditingEmployee(employee)}
											>
												✏️ Edytuj
											</button>
											<button
												className="btn btn-sm btn-error"
												onClick={() => handleDelete(employee.id)}
											>
												🗑️ Usuń
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Modalne okna */}
			<AddEmployeeModal
				show={showAddModal}
				onClose={() => setShowAddModal(false)}
				onEmployeeAdded={() => {
					fetchEmployees();
					setShowAddModal(false);
				}}
			/>

			<AddEmployeeModal
				show={!!editingEmployee}
				onClose={() => setEditingEmployee(null)}
				onEmployeeAdded={() => {
					fetchEmployees();
					setEditingEmployee(null);
				}}
				editingEmployee={editingEmployee}
			/>
		</div>
	);
}
