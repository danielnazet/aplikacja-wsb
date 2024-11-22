import React, { useState, useEffect } from "react";
import useAuthStore from "../lib/store";
import { dbOperations } from "../lib/db";

export default function EmployeeManagement() {
	// State for form data and employee list
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		role: "worker",
	});

	// State for editing mode
	const [editMode, setEditMode] = useState(false);
	const [editingId, setEditingId] = useState(null);

	// State for employees list
	const [employees, setEmployees] = useState([]);

	// Load employees on component mount
	useEffect(() => {
		loadEmployees();
	}, []);

	// Function to load all employees
	const loadEmployees = async () => {
		try {
			const allEmployees = await dbOperations.getAllUsers();
			setEmployees(allEmployees);
		} catch (error) {
			console.error("Failed to load employees:", error);
		}
	};

	// Handle form submission for both create and edit
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (editMode) {
				// Update existing employee
				await dbOperations.updateUser(editingId, {
					email: formData.email,
					firstName: formData.firstName,
					lastName: formData.lastName,
					role: formData.role,
				});
			} else {
				// Create new employee
				await dbOperations.createUser(formData);
			}

			// Reset form and reload employees
			setFormData({
				email: "",
				password: "",
				firstName: "",
				lastName: "",
				role: "worker",
			});
			setEditMode(false);
			setEditingId(null);
			await loadEmployees();
		} catch (error) {
			console.error("Operation failed:", error);
		}
	};

	// Handle edit button click
	const handleEdit = (employee) => {
		setFormData({
			email: employee.email,
			firstName: employee.firstName,
			lastName: employee.lastName,
			role: employee.role,
			password: "", // Password is not loaded for security
		});
		setEditMode(true);
		setEditingId(employee.id);
	};

	// Handle employee removal
	const handleRemove = async (id) => {
		try {
			await dbOperations.deleteUser(id);
			await loadEmployees();
		} catch (error) {
			console.error("Failed to remove employee:", error);
		}
	};

	// Handle form input changes
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-6">Employee Management</h2>

			<div className="grid gap-6">
				{/* Employee Form Card */}
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">
							{editMode ? "Edit Employee" : "Add New Employee"}
						</h3>
						<form onSubmit={handleSubmit} className="space-y-4">
							{/* First Name Field */}
							<div>
								<label className="label">
									<span className="label-text">
										First Name
									</span>
								</label>
								<input
									type="text"
									name="firstName"
									className="input input-bordered w-full"
									value={formData.firstName}
									onChange={handleChange}
									required
								/>
							</div>

							{/* Last Name Field */}
							<div>
								<label className="label">
									<span className="label-text">
										Last Name
									</span>
								</label>
								<input
									type="text"
									name="lastName"
									className="input input-bordered w-full"
									value={formData.lastName}
									onChange={handleChange}
									required
								/>
							</div>

							{/* Email Field */}
							<div>
								<label className="label">
									<span className="label-text">Email</span>
								</label>
								<input
									type="email"
									name="email"
									className="input input-bordered w-full"
									value={formData.email}
									onChange={handleChange}
									required
								/>
							</div>

							{/* Password Field - Only shown when creating new employee */}
							{!editMode && (
								<div>
									<label className="label">
										<span className="label-text">
											Password
										</span>
									</label>
									<input
										type="password"
										name="password"
										className="input input-bordered w-full"
										value={formData.password}
										onChange={handleChange}
										required={!editMode}
									/>
								</div>
							)}

							{/* Role Selection */}
							<div>
								<label className="label">
									<span className="label-text">Role</span>
								</label>
								<select
									name="role"
									className="select select-bordered w-full"
									value={formData.role}
									onChange={handleChange}
								>
									<option value="worker">Worker</option>
									<option value="foreman">Foreman</option>
									<option value="admin">Admin</option>
								</select>
							</div>

							{/* Submit Button */}
							<div className="flex gap-2">
								<button
									type="submit"
									className="btn btn-primary flex-1"
								>
									{editMode
										? "Update Employee"
										: "Add Employee"}
								</button>
								{editMode && (
									<button
										type="button"
										className="btn btn-ghost"
										onClick={() => {
											setEditMode(false);
											setEditingId(null);
											setFormData({
												email: "",
												password: "",
												firstName: "",
												lastName: "",
												role: "worker",
											});
										}}
									>
										Cancel
									</button>
								)}
							</div>
						</form>
					</div>
				</div>

				{/* Employees List Card */}
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Current Employees</h3>
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr>
										<th>Name</th>
										<th>Email</th>
										<th>Role</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{employees.map((employee) => (
										<tr key={employee.id}>
											<td>{`${employee.firstName} ${employee.lastName}`}</td>
											<td>{employee.email}</td>
											<td className="capitalize">
												{employee.role}
											</td>
											<td>
												<div className="flex gap-2">
													<button
														className="btn btn-sm btn-info"
														onClick={() =>
															handleEdit(employee)
														}
													>
														Edit
													</button>
													<button
														className="btn btn-sm btn-error"
														onClick={() =>
															handleRemove(
																employee.id
															)
														}
													>
														Remove
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
