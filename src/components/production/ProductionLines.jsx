import React, { useState, useEffect } from 'react';
import { useAuthStore, dbOperations } from "../../lib";
import { toast } from 'react-hot-toast';

export default function ProductionLines() {
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingLine, setEditingLine] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        loadLines();
    }, []);

    const loadLines = async () => {
        try {
            setLoading(true);
            const data = await dbOperations.getProductionLines();
            setLines(data);
        } catch (error) {
            console.error('Błąd ładowania linii:', error);
            toast.error('Nie udało się załadować linii produkcyjnych');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (line) => {
        setEditingLine(line);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Czy na pewno chcesz usunąć tę linię produkcyjną?')) {
            try {
                await dbOperations.deleteProductionLine(id);
                toast.success('Linia produkcyjna została usunięta');
                await loadLines();
            } catch (error) {
                console.error('Błąd usuwania linii:', error);
                toast.error('Nie udało się usunąć linii produkcyjnej');
            }
        }
    };

    const handleSave = async (formData) => {
        try {
            if (editingLine) {
                await dbOperations.updateProductionLine(editingLine.id, formData);
                toast.success('Linia produkcyjna została zaktualizowana');
            } else {
                await dbOperations.createProductionLine(formData);
                toast.success('Nowa linia produkcyjna została dodana');
            }
            setIsModalOpen(false);
            setEditingLine(null);
            await loadLines();
        } catch (error) {
            console.error('Błąd zapisywania linii:', error);
            toast.error('Nie udało się zapisać linii produkcyjnej');
        }
    };

    const handleAddNew = () => {
        setEditingLine(null);
        setIsModalOpen(true);
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'active': return 'badge-success';
            case 'inactive': return 'badge-error';
            case 'maintenance': return 'badge-warning';
            default: return 'badge-ghost';
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4">Ładowanie...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Linie Produkcyjne</h2>
                {user?.role === 'admin' && (
                    <button 
                        className="btn btn-primary"
                        onClick={handleAddNew}
                    >
                        Dodaj Linię
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lines.map(line => (
                    <div key={line.id} className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title flex justify-between">
                                {line.name}
                                <div className={`badge ${getStatusBadgeColor(line.status)}`}>
                                    {line.status}
                                </div>
                            </h3>
                            <p>{line.description}</p>
                            <div className="mt-4">
                                <div className="stat-title">Wydajność</div>
                                <div className="stat-value text-primary">{line.capacity}</div>
                                <div className="stat-desc">jednostek/dzień</div>
                            </div>
                            <div className="mt-2">
                                <div className="badge badge-outline">{line.type}</div>
                            </div>
                            {user?.role === 'admin' && (
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
                ))}
            </div>

            {isModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">
                            {editingLine ? 'Edytuj Linię Produkcyjną' : 'Dodaj Nową Linię Produkcyjną'}
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
        name: initialData?.name || '',
        description: initialData?.description || '',
        capacity: initialData?.capacity || 0,
        status: initialData?.status || 'active',
        type: initialData?.type || 'assembly'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'capacity' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Nazwa</span>
                </label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input input-bordered"
                    required
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
                />
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
                    required
                    min="0"
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
                >
                    <option value="active">Aktywna</option>
                    <option value="inactive">Nieaktywna</option>
                    <option value="maintenance">W konserwacji</option>
                </select>
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text">Typ</span>
                </label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="select select-bordered"
                >
                    <option value="assembly">Montażowa</option>
                    <option value="packaging">Pakowanie</option>
                    <option value="quality_control">Kontrola jakości</option>
                </select>
            </div>

            <div className="modal-action">
                <button type="button" className="btn" onClick={onCancel}>
                    Anuluj
                </button>
                <button type="submit" className="btn btn-primary">
                    {initialData ? 'Zapisz zmiany' : 'Dodaj linię'}
                </button>
            </div>
        </form>
    );
} 