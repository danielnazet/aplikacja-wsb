import { useState, useEffect } from "react";
import ProductionDataEntry from "./ProductionDataEntry";
import { dbOperations } from "../../lib";
import KPIHistory from "../kpi/KPIHistory";
import { toast } from "react-hot-toast";

export default function ProductionSchedule() {
	// const user = useAuthStore((state) => state.user);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [viewMode, setViewMode] = useState("day"); // 'day', 'week', 'month'
	const [productionLines, setProductionLines] = useState([]);
	const [selectedLine, setSelectedLine] = useState("all");
	const [scheduleData, setScheduleData] = useState([]);
	const [selectedEntry, setSelectedEntry] = useState(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// Pobierz linie produkcyjne przy ładowaniu
	useEffect(() => {
		const loadProductionLines = async () => {
			try {
				const lines = await dbOperations.getProductionLines();
				setProductionLines(lines);
			} catch (error) {
				console.error("Błąd ładowania linii:", error);
				toast.error("Nie udało się załadować linii produkcyjnych");
			}
		};

		loadProductionLines();
	}, []);

	// Dodaj funkcję loadScheduleData
	const loadScheduleData = async () => {
		try {
			const { startDate, endDate } = getDateRange();
			const data = await dbOperations.getProductionData(
				startDate.toISOString().split("T")[0],
				endDate.toISOString().split("T")[0]
			);
			setScheduleData(data);
		} catch (error) {
			console.error("Błąd ładowania danych:", error);
			toast.error("Nie udało się załadować danych harmonogramu");
		}
	};

	// Dodaj useEffect do ładowania danych przy montowaniu komponentu
	useEffect(() => {
		loadScheduleData();
	}, [selectedDate, viewMode]);

	const getDateRange = () => {
		const startDate = new Date(selectedDate);
		const endDate = new Date(selectedDate);

		switch (viewMode) {
			case "day":
				return { startDate, endDate };
			case "week":
				startDate.setDate(selectedDate.getDate() - 6);
				return { startDate, endDate };
			case "month":
				startDate.setDate(1);
				endDate.setMonth(endDate.getMonth() + 1, 0);
				return { startDate, endDate };
			default:
				return { startDate, endDate };
		}
	};

	const handleEdit = (entry) => {
		setSelectedEntry(entry);
		setIsEditModalOpen(true);
	};

	const handleDelete = async (id) => {
		if (window.confirm('Czy na pewno chcesz usunąć ten wpis?')) {
			try {
				await dbOperations.deleteProductionData(id);
				toast.success('Wpis został usunięty');
				loadScheduleData();
			} catch (error) {
				console.error('Błąd podczas usuwania:', error);
				toast.error('Nie udało się usunąć wpisu');
			}
		}
	};

	const handleUpdate = async (updatedData) => {
		try {
			await dbOperations.updateProductionData(selectedEntry.id, updatedData);
			toast.success('Dane zostały zaktualizowane');
			setIsEditModalOpen(false);
			loadScheduleData();
		} catch (error) {
			console.error('Błąd podczas aktualizacji:', error);
			toast.error('Nie udało się zaktualizować danych');
		}
	};

	return (
		<div className="p-6">
			<h2 className="text-2xl font-bold mb-4">Harmonogram Produkcji</h2>

			{/* Kontrolki nawigacji */}
			<div className="card bg-base-100 shadow-xl mb-6">
				<div className="card-body">
					<div className="flex justify-between items-center flex-wrap gap-4">
						<div className="btn-group">
							<button
								className={`btn btn-sm ${
									viewMode === "day" ? "btn-active" : ""
								}`}
								onClick={() => setViewMode("day")}
							>
								Dzień
							</button>
							<button
								className={`btn btn-sm ${
									viewMode === "week" ? "btn-active" : ""
								}`}
								onClick={() => setViewMode("week")}
							>
								Tydzień
							</button>
							<button
								className={`btn btn-sm ${
									viewMode === "month" ? "btn-active" : ""
								}`}
								onClick={() => setViewMode("month")}
							>
								Miesiąc
							</button>
						</div>

						{/* Wybór linii produkcyjnej */}
						<select
							className="select select-bordered select-sm"
							value={selectedLine}
							onChange={(e) => setSelectedLine(e.target.value)}
						>
							<option value="all">Wszystkie linie</option>
							{productionLines.map((line) => (
								<option key={line.id} value={line.id}>
									{line.name}
								</option>
							))}
						</select>

						<div className="flex items-center gap-4">
							<input
								type="date"
								className="input input-bordered input-sm"
								value={selectedDate.toISOString().split("T")[0]}
								onChange={(e) =>
									setSelectedDate(new Date(e.target.value))
								}
								max={new Date().toISOString().split("T")[0]}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Wyświetlanie harmonogramu */}
			<div className="card bg-base-100 shadow-xl mb-6">
				<div className="card-body">
					<h3 className="card-title">Harmonogram</h3>
					<div className="overflow-x-auto">
						<table className="table table-zebra w-full">
							<thead>
								<tr>
									<th>Data</th>
									<th>Zmiana</th>
									<th>Linia</th>
									<th>Produkt</th>
									<th>Plan</th>
									<th>Wykonanie</th>
									<th>Status</th>
									<th>Akcje</th>
								</tr>
							</thead>
							<tbody>
								{scheduleData.map((item, index) => {
									const line = productionLines.find(
										(l) => l.id === item.production_line_id
									);
									const completion = (
										(item.actual_units /
											item.planned_units) *
										100
									).toFixed(2);

									return (
										<tr key={index}>
											<td>{item.date}</td>
											<td>
												{item.shift === "morning"
													? "Ranna"
													: item.shift === "afternoon"
													? "Popołudniowa"
													: "Nocna"}
											</td>
											<td>{line?.name || "Nieznana"}</td>
											<td>{item.product_type}</td>
											<td>{item.planned_units}</td>
											<td>{item.actual_units}</td>
											<td>
												<div
													className="badge"
													style={{
														backgroundColor:
															parseFloat(completion) >= 99.99
																? "#4CAF50"
																: parseFloat(completion) >=
																  80
																? "#FFC107"
																: "#F44336",
														color: "white",
													}}
												>
													{completion}%
												</div>
											</td>
											<td>
												<div className="flex gap-2">
													<button
														className="btn btn-sm btn-info"
														onClick={() => handleEdit(item)}
													>
														Edytuj
													</button>
													<button
														className="btn btn-sm btn-error"
														onClick={() => handleDelete(item.id)}
													>
														Usuń
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			{/* Formularz wprowadzania danych */}
			<div className="card bg-base-100 shadow-xl mb-6">
				<div className="card-body">
					<h3 className="card-title">Wprowadź dane produkcyjne</h3>
					<ProductionDataEntry
						onDataAdded={loadScheduleData} // przekazujemy funkcję odświeżania
					/>
				</div>
			</div>

			{/* Historia produkcji */}
			<div className="card bg-base-100 shadow-xl mb-6">
				<div className="card-body">
					<h3 className="card-title">Historia produkcji</h3>
					<KPIHistory
						startDate={getDateRange().startDate.toISOString()}
						endDate={getDateRange().endDate.toISOString()}
					/>
				</div>
			</div>

			{/* Modal edycji */}
			{isEditModalOpen && selectedEntry && (
				<div className="modal modal-open">
					<div className="modal-box">
						<h3 className="font-bold text-lg mb-4">Edytuj dane produkcyjne</h3>
						<form onSubmit={(e) => {
							e.preventDefault();
							const formData = new FormData(e.target);
							handleUpdate({
								date: formData.get('date'),
								shift: formData.get('shift'),
								planned_units: parseInt(formData.get('planned_units')),
								actual_units: parseInt(formData.get('actual_units')),
								product_type: formData.get('product_type'),
								production_line_id: formData.get('production_line_id')
							});
						}}>
							<div className="form-control">
								<label className="label">
									<span className="label-text">Data</span>
								</label>
								<input
									type="date"
									name="date"
									defaultValue={selectedEntry.date}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Zmiana</span>
								</label>
								<select
									name="shift"
									defaultValue={selectedEntry.shift}
									className="select select-bordered"
									required
								>
									<option value="morning">Ranna</option>
									<option value="afternoon">Popołudniowa</option>
									<option value="night">Nocna</option>
								</select>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Planowana ilość</span>
								</label>
								<input
									type="number"
									name="planned_units"
									defaultValue={selectedEntry.planned_units}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Rzeczywista ilość</span>
								</label>
								<input
									type="number"
									name="actual_units"
									defaultValue={selectedEntry.actual_units}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Typ produktu</span>
								</label>
								<input
									type="text"
									name="product_type"
									defaultValue={selectedEntry.product_type}
									className="input input-bordered"
									required
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Linia produkcyjna</span>
								</label>
								<select
									name="production_line_id"
									defaultValue={selectedEntry.production_line_id}
									className="select select-bordered"
									required
								>
									{productionLines.map((line) => (
										<option key={line.id} value={line.id}>
											{line.name}
										</option>
									))}
								</select>
							</div>

							<div className="modal-action">
								<button type="submit" className="btn btn-primary">
									Zapisz zmiany
								</button>
								<button
									type="button"
									className="btn"
									onClick={() => setIsEditModalOpen(false)}
								>
									Anuluj
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Plan produkcji */}
			{/* <div className="card bg-base-100 shadow-xl"> */}
			{/* <div className="card-body"> */}
			{/* <h3 className="card-title">Plan produkcji</h3> */}
			{/* TODO: Dodać komponenty do wyświetlania harmonogramu */}
		</div>
		// </div>
		// </div>
	);
}
