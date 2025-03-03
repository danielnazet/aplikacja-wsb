import { useState, useEffect } from "react";
import { useAuthStore, dbOperations } from "../../lib";
import { toast } from "react-hot-toast";
import PropTypes from "prop-types";

export default function ProductionLines() {
	const [lines, setLines] = useState([]);
	const [loading, setLoading] = useState(true);
	const [editingLine, setEditingLine] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [machinesStatus, setMachinesStatus] = useState({});
	const user = useAuthStore((state) => state.user);

	useEffect(() => {
		loadLines();
	}, []);

	const loadLines = async () => {
		try {
			setLoading(true);
			const data = await dbOperations.getProductionLines();
			
			if (!data || !Array.isArray(data)) {
				console.error("Nieprawidłowe dane linii produkcyjnych:", data);
				setLines([]);
				toast.error("Nie udało się załadować linii produkcyjnych");
				return;
			}
			
			// Pobierz dane produkcyjne dla każdej linii
			try {
				const linesWithProductionData = await Promise.all(
					data.map(async (line) => {
						try {
							const productionData = await dbOperations.getProductionDataForLine(line.id);
							
							// Pobierz maszyny przypisane do linii
							const machines = await dbOperations.getMachinesForLine(line.id);
							
							// Oblicz statystyki maszyn
							const totalMachines = machines.length;
							const workingMachines = machines.filter(m => m.status === "working").length;
							const failureMachines = machines.filter(m => m.status === "failure").length;
							const serviceMachines = machines.filter(m => m.status === "service").length;
							
							// Zapisz statystyki maszyn dla tej linii
							setMachinesStatus(prev => ({
								...prev,
								[line.id]: {
									total: totalMachines,
									working: workingMachines,
									failure: failureMachines,
									service: serviceMachines,
									workingPercentage: totalMachines > 0 ? (workingMachines / totalMachines) * 100 : 100
								}
							}));
							
							return {
								...line,
								productionData: productionData || [],
								machines: {
									total: totalMachines,
									working: workingMachines,
									failure: failureMachines,
									service: serviceMachines,
									workingPercentage: totalMachines > 0 ? (workingMachines / totalMachines) * 100 : 100
								}
							};
						} catch (error) {
							console.error(`Błąd podczas pobierania danych produkcyjnych dla linii ${line.id}:`, error);
							return {
								...line,
								productionData: [],
								machines: {
									total: 0,
									working: 0,
									failure: 0,
									service: 0,
									workingPercentage: 100
								}
							};
						}
					})
				);
				setLines(linesWithProductionData);
			} catch (error) {
				console.error("Błąd podczas przetwarzania danych linii:", error);
				setLines(data.map(line => ({ 
					...line, 
					productionData: [],
					machines: {
						total: 0,
						working: 0,
						failure: 0,
						service: 0,
						workingPercentage: 100
					}
				})));
				toast.error("Wystąpił problem podczas ładowania danych produkcyjnych");
			}
		} catch (error) {
			console.error("Błąd podczas ładowania linii produkcyjnych:", error);
			setLines([]);
			toast.error("Nie udało się załadować linii produkcyjnych");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (line) => {
		setEditingLine(line);
		setIsModalOpen(true);
	};

	const handleDelete = async (id) => {
		if (
			window.confirm("Czy na pewno chcesz usunąć tę linię produkcyjną?")
		) {
			try {
				await dbOperations.deleteProductionLine(id);
				toast.success("Linia produkcyjna została usunięta");
				await loadLines();
			} catch (error) {
				console.error("Błąd usuwania linii:", error);
				toast.error("Nie udało się usunąć linii produkcyjnej");
			}
		}
	};

	const handleSave = async (formData) => {
		if (!formData) {
			toast.error("Brak danych do zapisania");
			return;
		}
		
		try {
			if (editingLine && editingLine.id) {
				await dbOperations.updateProductionLine(
					editingLine.id,
					formData
				);
				toast.success("Linia produkcyjna została zaktualizowana");
			} else {
				await dbOperations.createProductionLine(formData);
				toast.success("Nowa linia produkcyjna została dodana");
			}
			setIsModalOpen(false);
			setEditingLine(null);
			await loadLines();
		} catch (error) {
			console.error("Błąd zapisywania linii:", error);
			const errorMessage = error?.message || "Nie udało się zapisać linii produkcyjnej";
			toast.error(errorMessage);
		}
	};

	const handleAddNew = () => {
		setEditingLine(null);
		setIsModalOpen(true);
	};

	const getStatusBadgeColor = (status) => {
		if (!status) return "badge-ghost";
		
		switch (status.toLowerCase()) {
			case "active":
				return "badge-success";
			case "inactive":
				return "badge-error";
			case "maintenance":
				return "badge-warning";
			default:
				return "badge-ghost";
		}
	};

	if (loading) {
		return <div className="flex justify-center p-4">Ładowanie...</div>;
	}

	return (
		<div className="p-6">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold">Linie Produkcyjne</h2>
				{user?.role === "admin" && (
					<button className="btn btn-primary" onClick={handleAddNew}>
						Dodaj Linię
					</button>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{lines && lines.length > 0 ? (
					lines.map((line) => (
						<div key={line?.id || Math.random()} className="card bg-base-100 shadow-xl">
							<div className="card-body">
								<h3 className="card-title flex justify-between">
									{line?.name || 'Bez nazwy'}
									<div
										className={`badge ${getStatusBadgeColor(
											line?.status
										)}`}
									>
										{line?.status || 'Nieznany'}
									</div>
								</h3>
								<p>{line?.description || 'Brak opisu'}</p>
								<div className="mt-4">
									<div className="stat-title">Wydajność</div>
									<div className="stat-value text-primary">
										{line?.capacity || 0}
									</div>
									<div className="stat-desc">jednostek/dzień</div>
								</div>
								<div className="mt-2">
									<div className="badge badge-outline">
										{line?.type || 'Nieznany typ'}
									</div>
								</div>
								
								{/* Informacja o maszynach na linii */}
								{line?.machines && line.machines.total > 0 && (
									<div className="mt-4 p-2 bg-base-200 rounded-md">
										<h4 className="font-bold mb-1">Stan maszyn:</h4>
										<div className="flex justify-between text-sm">
											<span>Łącznie: {line.machines.total}</span>
											<span className="text-success">Sprawne: {line.machines.working}</span>
											{line.machines.failure > 0 && (
												<span className="text-error">Awarie: {line.machines.failure}</span>
											)}
											{line.machines.service > 0 && (
												<span className="text-warning">Serwis: {line.machines.service}</span>
											)}
										</div>
										<div className="mt-2">
											<div className="w-full bg-gray-300 rounded-full h-2.5">
												<div 
													className={`h-2.5 rounded-full ${line.machines.workingPercentage < 50 ? 'bg-error' : line.machines.workingPercentage < 80 ? 'bg-warning' : 'bg-success'}`}
													style={{ width: `${line.machines.workingPercentage}%` }}
												></div>
											</div>
											<p className="text-xs mt-1 text-center">
												{line.machines.workingPercentage < 100 && (
													<>
														Wydajność linii zmniejszona o {Math.round(100 - line.machines.workingPercentage)}% 
														z powodu awarii/serwisu maszyn
													</>
												)}
												{line.machines.workingPercentage === 100 && (
													<>Wszystkie maszyny sprawne</>
												)}
											</p>
										</div>
									</div>
								)}
								
								{/* Wyświetl dane produkcyjne dla linii */}
								<div className="mt-4">
									<h4 className="font-bold">
										Dane produkcyjne (dzisiaj):
									</h4>
									{line?.productionData && Array.isArray(line.productionData) && line.productionData.length > 0 ? (
										line.productionData.map((data) => (
											<div key={data?.id || Math.random()} className="p-2 bg-base-200 rounded-md mt-2">
												<p>Data: {data?.date || 'Nieznana'}</p>
												<p>Plan: {data?.planned_units || 0}</p>
												<p>Wykonanie: {data?.actual_units || 0}</p>
												<p>Typ produktu: {data?.product_type || 'Nieznany'}</p>
											</div>
										))
									) : (
										<p>Brak danych produkcyjnych na dzisiaj</p>
									)}
								</div>
								{user?.role === "admin" && (
									<div className="card-actions justify-end mt-4">
										<button
											className="btn btn-sm btn-outline"
											onClick={() => handleEdit(line)}
										>
											Edytuj
										</button>
										<button
											className="btn btn-sm btn-outline btn-error"
											onClick={() => handleDelete(line.id)}
										>
											Usuń
										</button>
									</div>
								)}
							</div>
						</div>
					))
				) : (
					<div className="col-span-full text-center p-4">
						<p>Brak linii produkcyjnych do wyświetlenia</p>
					</div>
				)}
			</div>

			{isModalOpen && (
				<div className="modal modal-open" onClick={(e) => {
					// Zapobiegaj zamykaniu modalu przy kliknięciu w tło
					e.stopPropagation();
				}}>
					<div className="modal-box" onClick={(e) => e.stopPropagation()}>
						<h3 className="font-bold text-lg">
							{editingLine
								? "Edytuj Linię Produkcyjną"
								: "Dodaj Nową Linię Produkcyjną"}
						</h3>
						<ProductionLineForm
							initialData={editingLine}
							onSubmit={handleSave}
							onCancel={() => {
								setIsModalOpen(false);
								setEditingLine(null);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}

function ProductionLineForm({ initialData, onSubmit, onCancel }) {
	const [formData, setFormData] = useState({
		name: initialData?.name || "",
		description: initialData?.description || "",
		capacity: initialData?.capacity || 0,
		status: initialData?.status || "active",
		type: initialData?.type || "assembly",
	});

	const handleChange = (e) => {
		if (!e || !e.target) return;
		
		e.stopPropagation();
		const { name, value } = e.target;
		if (!name) return;
		
		setFormData((prev) => ({
			...prev,
			[name]: name === "capacity" ? parseInt(value) || 0 : value,
		}));
	};

	const handleSubmit = (e) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		
		// Walidacja podstawowa
		if (!formData.name.trim()) {
			toast.error("Nazwa linii jest wymagana");
			return;
		}
		
		onSubmit({
			...formData,
			id: initialData?.id,
		});
	};

	const stopPropagation = (e) => {
		if (e) e.stopPropagation();
	};

	return (
		<form onSubmit={handleSubmit} onClick={stopPropagation}>
			<div className="form-control">
				<label className="label">
					<span className="label-text">Nazwa linii*</span>
				</label>
				<input
					type="text"
					name="name"
					value={formData.name}
					onChange={handleChange}
					className="input input-bordered"
					required
					onClick={stopPropagation}
				/>
			</div>

			<div className="form-control">
				<label className="label">
					<span className="label-text">Opis</span>
				</label>
				<textarea
					name="description"
					value={formData.description}
					onChange={handleChange}
					className="textarea textarea-bordered"
					onClick={stopPropagation}
				></textarea>
			</div>

			<div className="form-control">
				<label className="label">
					<span className="label-text">Wydajność (jednostek/dzień)</span>
				</label>
				<input
					type="number"
					name="capacity"
					value={formData.capacity}
					onChange={handleChange}
					className="input input-bordered"
					min="0"
					onClick={stopPropagation}
				/>
			</div>

			<div className="form-control">
				<label className="label">
					<span className="label-text">Status</span>
				</label>
				<select
					name="status"
					value={formData.status}
					onChange={handleChange}
					className="select select-bordered"
					onClick={stopPropagation}
				>
					<option value="active">Aktywna</option>
					<option value="inactive">Nieaktywna</option>
					<option value="maintenance">W konserwacji</option>
				</select>
			</div>

			<div className="form-control">
				<label className="label">
					<span className="label-text">Typ linii</span>
				</label>
				<select
					name="type"
					value={formData.type}
					onChange={handleChange}
					className="select select-bordered"
					onClick={stopPropagation}
				>
					<option value="assembly">Montażowa</option>
					<option value="packaging">Pakowanie</option>
					<option value="quality_control">Kontrola jakości</option>
				</select>
			</div>

			<div className="modal-action">
				<button type="button" className="btn" onClick={(e) => {
					stopPropagation(e);
					onCancel();
				}}>
					Anuluj
				</button>
				<button type="submit" className="btn btn-primary" onClick={stopPropagation}>
					{initialData ? "Zapisz zmiany" : "Dodaj linię"}
				</button>
			</div>
		</form>
	);
}

ProductionLineForm.propTypes = {
	initialData: PropTypes.shape({
		name: PropTypes.string,
		description: PropTypes.string,
		capacity: PropTypes.number,
		status: PropTypes.string,
		type: PropTypes.string,
	}),
	onSubmit: PropTypes.func.isRequired,
	onCancel: PropTypes.func.isRequired,
};
