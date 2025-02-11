import React, { useState, useEffect } from "react";
import { useAuthStore, useStore } from "../lib/store";
import { dbOperations } from "../lib/db";

export default function EmployeeManagement() {
	const [employees, setEmployees] = useState([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [selectedEmployee, setSelectedEmployee] = useState(null);
	const [formData, setFormData] = useState({
		email: "",
		firstName: "",
		lastName: "",
		role: "worker",
		password: "",
	});
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		loadEmployees();
	}, []);

	const loadEmployees = async () => {
		try {
			const allEmployees = await dbOperations.getAllUsers();
			setEmployees(allEmployees.filter(emp => emp.role !== "admin"));
		} catch (error) {
			console.error("Failed to load employees:", error);
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleEditClick = (employee) => {
		setSelectedEmployee(employee);
		setFormData({
			email: employee.email,
			firstName: employee.firstName,
			lastName: employee.lastName,
			role: employee.role,
			password: "", // Puste hasło przy edycji
		});
		setShowEditModal(true);
	};

	const handleDeleteClick = (employee) => {
		setSelectedEmployee(employee);
		setShowDeleteModal(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await dbOperations.addUser(formData);
			await loadEmployees();
			setShowAddModal(false);
			setFormData({
				email: "",
				firstName: "",
				lastName: "",
				role: "worker",
				password: "",
			});
		} catch (error) {
			setError("Nie udało się dodać pracownika. Spróbuj ponownie.");
			console.error("Failed to add employee:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdate = async (e) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			const updateData = { ...formData };
			if (!updateData.password) {
				delete updateData.password; // Nie aktualizuj hasła jeśli jest puste
			}
			
			await dbOperations.updateUser(selectedEmployee.id, updateData);
			await loadEmployees();
			setShowEditModal(false);
		} catch (error) {
			setError("Nie udało się zaktualizować danych pracownika.");
			console.error("Failed to update employee:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		setIsLoading(true);
		try {
			await dbOperations.deleteUser(selectedEmployee.id);
			await loadEmployees();
			setShowDeleteModal(false);
		} catch (error) {
			setError("Nie udało się usunąć pracownika.");
			console.error("Failed to delete employee:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold">Zarządzanie Pracownikami</h2>
				<button 
					className="btn btn-primary"
					onClick={() => setShowAddModal(true)}
				>
					Dodaj Pracownika
				</button>
			</div>

			<div className="overflow-x-auto">
				<table className="table w-full">
					<thead>
						<tr>
							<th>Imię i Nazwisko</th>
							<th>Email</th>
							<th>Rola</th>
							<th>Akcje</th>
						</tr>
					</thead>
					<tbody>
						{employees.map((employee) => (
							<tr key={employee.id}>
								<td>{employee.firstName} {employee.lastName}</td>
								<td>{employee.email}</td>
								<td>
									<span className="badge badge-ghost">
										{employee.role}
									</span>
								</td>
								<td className="space-x-2">
									<button 
										className="btn btn-sm btn-ghost"
										onClick={() => handleEditClick(employee)}
									>
										Edytuj
									</button>
									<button 
										className="btn btn-sm btn-error btn-ghost"
										onClick={() => handleDeleteClick(employee)}
									>
										Usuń
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Modal dodawania */}
			{showAddModal && (
				<dialog className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">Dodaj Nowego Pracownika</h3>
						{error && (
							<div className="alert alert-error mb-4">
								<span>{error}</span>
							</div>
						)}
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Imię</span>
									</label>
									<input
										type="text"
										name="firstName"
										value={formData.firstName}
										onChange={handleInputChange}
										className="input input-bordered"
										required
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Nazwisko</span>
									</label>
									<input
										type="text"
										name="lastName"
										value={formData.lastName}
										onChange={handleInputChange}
										className="input input-bordered"
										required
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Email</span>
								</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Hasło</span>
								</label>
								<input
									type="password"
									name="password"
									value={formData.password}
									onChange={handleInputChange}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Rola</span>
								</label>
								<select
									name="role"
									value={formData.role}
									onChange={handleInputChange}
									className="select select-bordered"
									required
								>
									<option value="worker">Pracownik</option>
									<option value="foreman">Brygadzista</option>
								</select>
							</div>

							<div className="modal-action">
								<button 
									type="button" 
									className="btn" 
									onClick={() => setShowAddModal(false)}
									disabled={isLoading}
								>
									Anuluj
								</button>
								<button 
									type="submit" 
									className="btn btn-primary"
									disabled={isLoading}
								>
									{isLoading ? "Dodawanie..." : "Dodaj"}
								</button>
							</div>
						</form>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button onClick={() => setShowAddModal(false)}>close</button>
					</form>
				</dialog>
			)}

			{/* Modal edycji */}
			{showEditModal && (
				<dialog className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">Edytuj Dane Pracownika</h3>
						{error && (
							<div className="alert alert-error mb-4">
								<span>{error}</span>
							</div>
						)}
						<form onSubmit={handleUpdate} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="form-control">
									<label className="label">
										<span className="label-text">Imię</span>
									</label>
									<input
										type="text"
										name="firstName"
										value={formData.firstName}
										onChange={handleInputChange}
										className="input input-bordered"
										required
									/>
								</div>
								<div className="form-control">
									<label className="label">
										<span className="label-text">Nazwisko</span>
									</label>
									<input
										type="text"
										name="lastName"
										value={formData.lastName}
										onChange={handleInputChange}
										className="input input-bordered"
										required
									/>
								</div>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Email</span>
								</label>
								<input
									type="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Nowe hasło (opcjonalne)</span>
								</label>
								<input
									type="password"
									name="password"
									value={formData.password}
									onChange={handleInputChange}
									className="input input-bordered"
									placeholder="Pozostaw puste, aby nie zmieniać"
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Rola</span>
								</label>
								<select
									name="role"
									value={formData.role}
									onChange={handleInputChange}
									className="select select-bordered"
									required
								>
									<option value="worker">Pracownik</option>
									<option value="foreman">Brygadzista</option>
								</select>
							</div>

							<div className="modal-action">
								<button 
									type="button" 
									className="btn" 
									onClick={() => setShowEditModal(false)}
									disabled={isLoading}
								>
									Anuluj
								</button>
								<button 
									type="submit" 
									className="btn btn-primary"
									disabled={isLoading}
								>
									{isLoading ? "Zapisywanie..." : "Zapisz zmiany"}
								</button>
							</div>
						</form>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button onClick={() => setShowEditModal(false)}>close</button>
					</form>
				</dialog>
			)}

			{/* Modal potwierdzenia usunięcia */}
			{showDeleteModal && (
				<dialog className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">Potwierdź usunięcie</h3>
						<p>Czy na pewno chcesz usunąć pracownika {selectedEmployee?.firstName} {selectedEmployee?.lastName}?</p>
						<p className="text-sm text-error mt-2">Tej operacji nie można cofnąć.</p>
						<div className="modal-action">
							<button 
								className="btn" 
								onClick={() => setShowDeleteModal(false)}
								disabled={isLoading}
							>
								Anuluj
							</button>
							<button 
								className="btn btn-error"
								onClick={handleDelete}
								disabled={isLoading}
							>
								{isLoading ? "Usuwanie..." : "Usuń"}
							</button>
						</div>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button onClick={() => setShowDeleteModal(false)}>close</button>
					</form>
				</dialog>
			)}
		</div>
	);
}
