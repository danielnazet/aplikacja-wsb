import React, { useState, useEffect } from "react";
import { useAuthStore, useStore, dbOperations } from "../../lib";

export default function TaskManagement() {
	// Form state
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		priority: "medium",
		assignedTo: "",
		dueDate: "",
		status: "pending",
	});

	// UI state
	const [tasks, setTasks] = useState([]);
	const [employees, setEmployees] = useState([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [editMode, setEditMode] = useState(false);
	const [editingId, setEditingId] = useState(null);

	const user = useAuthStore((state) => state.user);

	// Load tasks and employees on component mount
	useEffect(() => {
		if (user) {
			loadTasks();
			loadEmployees();
		}
	}, [user]);

	// Load all tasks
	const loadTasks = async () => {
		try {
			let tasksList;
			if (user.role === "admin") {
				tasksList = await dbOperations.getAllTasks();
			} else {
				tasksList = await dbOperations.getUserTasks(user.id);
			}
			setTasks(tasksList);
		} catch (error) {
			console.error("Failed to load tasks:", error);
			setError("Failed to load tasks. Please try again.");
		}
	};

	// Load all employees for task assignment
	const loadEmployees = async () => {
		try {
			const employeesList = await dbOperations.getAllUsers();
			setEmployees(employeesList.filter((emp) => emp.role !== "admin"));
		} catch (error) {
			console.error("Failed to load employees:", error);
		}
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			if (!user?.id) {
				throw new Error("User not authenticated");
			}

			const taskData = {
				...formData,
				createdBy: user.id,
				createdAt: new Date().toISOString(),
			};

			if (editMode) {
				await dbOperations.updateTask(editingId, taskData);
			} else {
				await dbOperations.createTask(taskData);
			}

			setFormData({
				title: "",
				description: "",
				priority: "medium",
				assignedTo: "",
				dueDate: "",
				status: "pending",
			});
			setEditMode(false);
			setEditingId(null);
			await loadTasks();
		} catch (error) {
			console.error("Failed to save task:", error);
			setError(error.message || "Failed to save task. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle task progress update
	const handleProgressUpdate = async (taskId, progress) => {
		try {
			// Update local state immediately for better UX
			setTasks(
				tasks.map((task) =>
					task.id === taskId ? { ...task, progress } : task
				)
			);

			// Update in database
			await dbOperations.updateTaskProgress(taskId, progress, user.id);

			// Refresh tasks to ensure consistency
			await loadTasks();
		} catch (error) {
			console.error("Failed to update progress:", error);
			// Revert local state on error
			await loadTasks();
		}
	};

	// Handle task status update
	const handleStatusUpdate = async (taskId, status) => {
		try {
			await dbOperations.updateTaskStatus(taskId, status);
			await loadTasks();
		} catch (error) {
			console.error("Failed to update status:", error);
		}
	};

	// Handle task edit
	const handleEdit = (task) => {
		setFormData({
			title: task.title,
			description: task.description,
			priority: task.priority,
			assignedTo: task.assignedTo,
			dueDate: task.dueDate,
			status: task.status,
		});
		setEditMode(true);
		setEditingId(task.id);
	};

	// Handle task removal
	const handleRemove = async (taskId) => {
		try {
			await dbOperations.deleteTask(taskId);
			await loadTasks();
		} catch (error) {
			console.error("Failed to remove task:", error);
		}
	};

	// Handle form input changes
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-6">Task Management</h2>

			{user.role === "admin" && (
				<div className="card bg-base-100 shadow-xl mb-6">
					<div className="card-body">
						<h3 className="card-title">
							{editMode ? "Edit Task" : "Create New Task"}
						</h3>
						{error && (
							<div className="alert alert-error">
								<span>{error}</span>
							</div>
						)}
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="label">
									<span className="label-text">Title</span>
								</label>
								<input
									type="text"
									name="title"
									className="input input-bordered w-full"
									value={formData.title}
									onChange={handleChange}
									required
								/>
							</div>

							<div>
								<label className="label">
									<span className="label-text">
										Description
									</span>
								</label>
								<textarea
									name="description"
									className="textarea textarea-bordered w-full"
									value={formData.description}
									onChange={handleChange}
									required
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="label">
										<span className="label-text">
											Priority
										</span>
									</label>
									<select
										name="priority"
										className="select select-bordered w-full"
										value={formData.priority}
										onChange={handleChange}
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</div>

								<div>
									<label className="label">
										<span className="label-text">
											Assign To
										</span>
									</label>
									<select
										name="assignedTo"
										className="select select-bordered w-full"
										value={formData.assignedTo}
										onChange={handleChange}
										required
									>
										<option value="">
											Select Employee
										</option>
										{employees.map((emp) => (
											<option key={emp.id} value={emp.id}>
												{emp.firstName} {emp.lastName} (
												{emp.role})
											</option>
										))}
									</select>
								</div>

								<div>
									<label className="label">
										<span className="label-text">
											Due Date
										</span>
									</label>
									<input
										type="date"
										name="dueDate"
										className="input input-bordered w-full"
										value={formData.dueDate}
										onChange={handleChange}
										required
									/>
								</div>
							</div>

							<div className="flex gap-2">
								<button
									type="submit"
									className={`btn btn-primary flex-1 ${
										isSubmitting ? "loading" : ""
									}`}
									disabled={isSubmitting}
								>
									{isSubmitting
										? editMode
											? "Updating..."
											: "Creating..."
										: editMode
										? "Update Task"
										: "Create Task"}
								</button>
								{editMode && (
									<button
										type="button"
										className="btn btn-ghost"
										onClick={() => {
											setEditMode(false);
											setEditingId(null);
											setFormData({
												title: "",
												description: "",
												priority: "medium",
												assignedTo: "",
												dueDate: "",
												status: "pending",
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
			)}

			<div className="grid gap-6">
				{["pending", "in-progress", "completed"].map((status) => (
					<div key={status} className="card bg-base-100 shadow-xl">
						<div className="card-body">
							<h3 className="card-title capitalize">
								{status.replace("-", " ")} Tasks
							</h3>
							<div className="overflow-x-auto">
								<table className="table w-full">
									<thead>
										<tr>
											<th>Title</th>
											<th>Description</th>
											<th>Priority</th>
											<th>Assigned To</th>
											<th>Due Date</th>
											<th>Progress</th>
											<th>Actions</th>
										</tr>
									</thead>
									<tbody>
										{tasks
											.filter(
												(task) => task.status === status
											)
											.map((task) => (
												<tr key={task.id}>
													<td>{task.title}</td>
													<td>{task.description}</td>
													<td className="capitalize">
														{task.priority}
													</td>
													<td>
														{employees.find(
															(emp) =>
																emp.id ===
																task.assignedTo
														)?.firstName ||
															"Unknown"}
													</td>
													<td>
														{new Date(
															task.dueDate
														).toLocaleDateString()}
													</td>
													<td>
														<input
															type="range"
															min="0"
															max="100"
															value={
																task.progress ||
																0
															}
															className="range range-xs"
															onChange={(e) =>
																handleProgressUpdate(
																	task.id,
																	parseInt(
																		e.target
																			.value
																	)
																)
															}
															disabled={
																user.role ===
																"admin"
															}
														/>
														<span className="text-sm">
															{task.progress || 0}
															%
														</span>
													</td>
													<td>
														<div className="flex gap-2">
															{user.role ===
																"admin" && (
																<>
																	<button
																		className="btn btn-sm btn-info"
																		onClick={() =>
																			handleEdit(
																				task
																			)
																		}
																	>
																		Edit
																	</button>
																	<button
																		className="btn btn-sm btn-error"
																		onClick={() =>
																			handleRemove(
																				task.id
																			)
																		}
																	>
																		Remove
																	</button>
																</>
															)}
															{user.role !==
																"admin" && (
																<select
																	className="select select-bordered select-sm"
																	value={
																		task.status
																	}
																	onChange={(
																		e
																	) =>
																		handleStatusUpdate(
																			task.id,
																			e
																				.target
																				.value
																		)
																	}
																>
																	<option value="pending">
																		Pending
																	</option>
																	<option value="in-progress">
																		In
																		Progress
																	</option>
																	<option value="completed">
																		Completed
																	</option>
																</select>
															)}
														</div>
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
