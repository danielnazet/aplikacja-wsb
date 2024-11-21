import React, { useState } from "react";
import useAuthStore from "../lib/store";

export default function EmployeeManagement() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		role: "worker",
	});

	const addEmployee = useAuthStore((state) => state.addEmployee);
	const removeEmployee = useAuthStore((state) => state.removeEmployee);
	const employees = useAuthStore((state) => state.employees);

	const handleSubmit = (e) => {
		e.preventDefault();
		addEmployee(formData);
		setFormData({ email: "", password: "", role: "worker" });
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-6">Employee Management</h2>

			<div className="grid gap-6">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Add New Employee</h3>
						<form onSubmit={handleSubmit} className="space-y-4">
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

							<div>
								<label className="label">
									<span className="label-text">Password</span>
								</label>
								<input
									type="password"
									name="password"
									className="input input-bordered w-full"
									value={formData.password}
									onChange={handleChange}
									required
								/>
							</div>

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
								</select>
							</div>

							<button
								type="submit"
								className="btn btn-primary w-full"
							>
								Add Employee
							</button>
						</form>
					</div>
				</div>

				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Current Employees</h3>
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr>
										<th>Email</th>
										<th>Role</th>
										<th>Actions</th>
									</tr>
								</thead>
								<tbody>
									{employees.map((employee) => (
										<tr key={employee.id}>
											<td>{employee.email}</td>
											<td className="capitalize">
												{employee.role}
											</td>
											<td>
												<button
													className="btn btn-error btn-sm"
													onClick={() =>
														removeEmployee(
															employee.id
														)
													}
												>
													Remove
												</button>
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
