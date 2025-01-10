import React, { useState, useEffect } from "react";
import { useAuthStore, useStore } from "../lib/store";
import { dbOperations } from "../lib/db";

export default function EmployeeManagement() {
	const [employees, setEmployees] = useState([]);

	useEffect(() => {
		loadEmployees();
	}, []);

	const loadEmployees = async () => {
		try {
			const allEmployees = await dbOperations.getAllUsers();
			setEmployees(allEmployees);
		} catch (error) {
			console.error("Failed to load employees:", error);
		}
	};

	return (
		<div>
			<h1>Employee Management</h1>
			<ul>
				{employees.map((employee) => (
					<li key={employee.id}>
						{employee.firstName} {employee.lastName} -{" "}
						{employee.role}
					</li>
				))}
			</ul>
		</div>
	);
}
