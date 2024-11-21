import React, { useState } from "react";
import useAuthStore from "../lib/store";

export default function SavingsProjects() {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		targetSavings: "",
		currentSavings: "",
		deadline: "",
	});

	const addSavingsProject = useAuthStore((state) => state.addSavingsProject);
	const removeSavingsProject = useAuthStore(
		(state) => state.removeSavingsProject
	);
	const savingsProjects = useAuthStore((state) => state.savingsProjects);

	const handleSubmit = (e) => {
		e.preventDefault();
		const project = {
			...formData,
			targetSavings: parseFloat(formData.targetSavings),
			currentSavings: parseFloat(formData.currentSavings),
			progress:
				(parseFloat(formData.currentSavings) /
					parseFloat(formData.targetSavings)) *
				100,
		};

		addSavingsProject(project);
		setFormData({
			name: "",
			description: "",
			targetSavings: "",
			currentSavings: "",
			deadline: "",
		});
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-6">Savings Projects</h2>

			<div className="grid gap-6">
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body">
						<h3 className="card-title">Add New Savings Project</h3>
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
								className="btn btn-primary w-full"
							>
								Add Project
							</button>
						</form>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{savingsProjects.map((project) => (
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
											{project.progress.toFixed(1)}%
										</span>
									</div>
									<progress
										className="progress progress-primary w-full"
										value={project.progress}
										max="100"
									></progress>
								</div>
								<div className="mt-2 text-sm">
									<p>Target: ${project.targetSavings}</p>
									<p>Current: ${project.currentSavings}</p>
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
										onClick={() =>
											removeSavingsProject(project.id)
										}
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
