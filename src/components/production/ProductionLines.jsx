import React, { useState, useEffect } from 'react';
import { useAuthStore, dbOperations } from "../../lib";
import { toast } from 'react-hot-toast';

export default function ProductionLines() {
    const [lines, setLines] = useState([]);
    const [loading, setLoading] = useState(true);
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

    const initializeLines = async () => {
        try {
            if (user?.role !== 'admin') {
                toast.error('Tylko administrator może inicjalizować linie produkcyjne');
                return;
            }

            await dbOperations.setupProductionLines();
            toast.success('Linie produkcyjne zostały utworzone');
            await loadLines();
        } catch (error) {
            console.error('Błąd inicjalizacji linii:', error);
            toast.error(`Nie udało się utworzyć linii produkcyjnych: ${error.message}`);
        }
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
                        onClick={initializeLines}
                    >
                        Inicjalizuj Linie
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
                                    <button className="btn btn-sm btn-outline">
                                        Edytuj
                                    </button>
                                    <button className="btn btn-sm btn-outline btn-error">
                                        Usuń
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
} 