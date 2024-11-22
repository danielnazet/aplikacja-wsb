import React, { useState, useEffect } from "react";
import useAuthStore from "../lib/store";
import { dbOperations } from "../lib/db";

export default function SavingsProjects() {
	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		targetSavings: "",
		currentSavings: "",
		deadline: "",
	});

	// UI state
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [projects, setProjects] = useState([]);

	// Summary statistics
	const [summary, setSummary] = useState({
		monthly: {},
		yearly: {},
		total: {
			targetSavings: 0,
			currentSavings: 0,
			totalProjects: 0,
			averageProgress: 0,
		},
	});

	const user = useAuthStore((state) => state.user);

	// Load projects on component mount and user change
	useEffect(() => {
		if (user) {
			loadProjects();
		}
	}, [user]);

	// Calculate summary statistics when projects change
	useEffect(() => {
		calculateSummary();
	}, [projects]);

	// Load all projects from database
	const loadProjects = async () => {
		try {
			const allProjects = await dbOperations.getAllSavingsProjects();
			setProjects(allProjects);
		} catch (error) {
			console.error("Failed to load projects:", error);
			setError("Failed to load projects. Please try again.");
		}
	};

	// Calculate summary statistics
	const calculateSummary = () => {
		const monthly = {};
		const yearly = {};
		let totalTargetSavings = 0;
		let totalCurrentSavings = 0;

		projects.forEach((project) => {
			const date = new Date(project.createdAt);
			const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
			const yearKey = `${date.getFullYear()}`;

			// Monthly summary
			if (!monthly[monthKey]) {
				monthly[monthKey] = {
					targetSavings: 0,
					currentSavings: 0,
					count: 0,
				};
			}
			monthly[monthKey].targetSavings += project.targetSavings;
			monthly[monthKey].currentSavings += project.currentSavings;
			monthly[monthKey].count++;

			// Yearly summary
			if (!yearly[yearKey]) {
				yearly[yearKey] = {
					targetSavings: 0,
					currentSavings: 0,
					count: 0,
				};
			}
			yearly[yearKey].targetSavings += project.targetSavings;
			yearly[yearKey].currentSavings += project.currentSavings;
			yearly[yearKey].count++;

			// Total summary
			totalTargetSavings += project.targetSavings;
			totalCurrentSavings += project.currentSavings;
		});

		setSummary({
			monthly,
			yearly,
			total: {
				targetSavings: totalTargetSavings,
				currentSavings: totalCurrentSavings,
				totalProjects: projects.length,
				averageProgress:
					totalTargetSavings > 0
						? (totalCurrentSavings / totalTargetSavings) * 100
						: 0,
			},
		});
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

			const targetSavings = parseFloat(formData.targetSavings);
			const currentSavings = parseFloat(formData.currentSavings);

			if (isNaN(targetSavings) || isNaN(currentSavings)) {
				throw new Error("Invalid savings amounts");
			}

			if (currentSavings > targetSavings) {
				throw new Error("Current savings cannot exceed target savings");
			}

			const project = {
				...formData,
				targetSavings,
				currentSavings,
				createdBy: user.id,
				createdAt: new Date().toISOString(),
			};

			await dbOperations.createSavingsProject(project);

			setFormData({
				name: "",
				description: "",
				targetSavings: "",
				currentSavings: "",
				deadline: "",
			});

			await loadProjects();
		} catch (error) {
			console.error("Failed to create project:", error);
			setError(
				error.message || "Failed to create project. Please try again."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle form input changes
	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-6">Savings Projects</h2>

			{/* Summary Section */}
			<div className="grid gap-6 mb-6">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Overall Summary</h3>
						<div className="stats stats-vertical lg:stats-horizontal shadow">
							<div className="stat">
								<div className="stat-title">Total Projects</div>
								<div className="stat-value">
									{summary.total.totalProjects}
								</div>
							</div>
							<div className="stat">
								<div className="stat-title">Total Target</div>
								<div className="stat-value">
									${summary.total.targetSavings.toFixed(2)}
								</div>
							</div>
							<div className="stat">
								<div className="stat-title">Total Saved</div>
								<div className="stat-value">
									${summary.total.currentSavings.toFixed(2)}
								</div>
							</div>
							<div className="stat">
								<div className="stat-title">
									Average Progress
								</div>
								<div className="stat-value">
									{summary.total.averageProgress.toFixed(1)}%
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Monthly Summary */}
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Monthly Summary</h3>
						<div className="overflow-x-auto">
							<table className="table w-full">
								<thead>
									<tr>
										<th>Month</th>
										<th>Projects</th>
										<th>Target</th>
										<th>Current</th>
										<th>Progress</th>
									</tr>
								</thead>
								<tbody>
									{Object.entries(summary.monthly)
										.sort((a, b) =>
											b[0].localeCompare(a[0])
										)
										.map(([month, data]) => (
											<tr key={month}>
												<td>{month}</td>
												<td>{data.count}</td>
												<td>
													$
													{data.targetSavings.toFixed(
														2
													)}
												</td>
												<td>
													$
													{data.currentSavings.toFixed(
														2
													)}
												</td>
												<td>
													{(
														(data.currentSavings /
															data.targetSavings) *
														100
													).toFixed(1)}
													%
												</td>
											</tr>
										))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			{/* Project Form */}
			<div className="grid gap-6">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Add New Project</h3>
						{error && (
							<div className="alert alert-error">
								<span>{error}</span>
							</div>
						)}
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label className="label">
									<span className="label-text">
										Project Name
									</span>
								</label>
								<input
									type="text"
									name="name"
									className="input input-bordered w-full"
									value={formData.name}
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

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="label">
										<span className="label-text">
											Target Savings ($)
										</span>
									</label>
									<input
										type="number"
										name="targetSavings"
										className="input input-bordered w-full"
										value={formData.targetSavings}
										onChange={handleChange}
										required
										min="0"
										step="0.01"
									/>
								</div>

								<div>
									<label className="label">
										<span className="label-text">
											Current Savings ($)
										</span>
									</label>
									<input
										type="number"
										name="currentSavings"
										className="input input-bordered w-full"
										value={formData.currentSavings}
										onChange={handleChange}
										required
										min="0"
										step="0.01"
									/>
								</div>
							</div>

							<div>
								<label className="label">
									<span className="label-text">Deadline</span>
								</label>
								<input
									type="date"
									name="deadline"
									className="input input-bordered w-full"
									value={formData.deadline}
									onChange={handleChange}
									required
								/>
							</div>

							<button
								type="submit"
								className={`btn btn-primary w-full ${
									isSubmitting ? "loading" : ""
								}`}
								disabled={isSubmitting}
							>
								{isSubmitting
									? "Adding Project..."
									: "Add Project"}
							</button>
						</form>
					</div>
				</div>

				{/* Projects List */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{projects.map((project) => (
						<div
							key={project.id}
							className="card bg-base-100 shadow-xl"
						>
							<div className="card-body">
								<h3 className="card-title">{project.name}</h3>
								<p>{project.description}</p>
								<div className="mt-4">
									<div className="flex justify-between mb-2">
										<span>Progress</span>
										<span>
											{(
												(project.currentSavings /
													project.targetSavings) *
												100
											).toFixed(1)}
											%
										</span>
									</div>
									<progress
										className="progress progress-primary w-full"
										value={project.currentSavings}
										max={project.targetSavings}
									></progress>
								</div>
								<div className="mt-2 text-sm">
									<p>
										Target: $
										{project.targetSavings.toFixed(2)}
									</p>
									<p>
										Current: $
										{project.currentSavings.toFixed(2)}
									</p>
									<p>
										Deadline:{" "}
										{new Date(
											project.deadline
										).toLocaleDateString()}
									</p>
								</div>
								<div className="card-actions justify-end mt-4">
									<button
										className="btn btn-error btn-sm"
										onClick={() => handleRemove(project.id)}
									>
										Remove
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
