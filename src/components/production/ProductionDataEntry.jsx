import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib';
import { dbOperations } from '../../lib/db/db';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
    date: z.string(),
    shift: z.enum(['morning', 'afternoon', 'night']),
    planned_units: z.number().min(0),
    actual_units: z.number().min(0),
    product_type: z.string().min(1),
    production_line_id: z.string().min(1)
});

export default function ProductionDataEntry({ onDataAdded }) {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [productionLines, setProductionLines] = useState([]);
    const [machines, setMachines] = useState([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            shift: 'morning',
            planned_units: 0,
            actual_units: 0,
            product_type: '',
            production_line_id: '',
            machine_id: ''
        }
    });

    // Pobierz linie i maszyny przy ładowaniu komponentu
    useEffect(() => {
        const loadProductionData = async () => {
            try {
                const lines = await dbOperations.getProductionLines();
                setProductionLines(lines);
            } catch (error) {
                console.error('Błąd ładowania linii produkcyjnych:', error);
                toast.error('Nie udało się załadować linii produkcyjnych');
            }
        };
        
        loadProductionData();
    }, []);

    // Pobierz maszyny dla wybranej linii
    const loadMachinesForLine = async (lineId) => {
        try {
            const machines = await dbOperations.getMachinesForLine(lineId);
            setMachines(machines);
        } catch (error) {
            console.error('Błąd ładowania maszyn:', error);
            toast.error('Nie udało się załadować maszyn');
        }
    };

    const onSubmit = async (formData) => {
        if (!user?.id) {
            toast.error('Musisz być zalogowany aby dodać dane');
            return;
        }

        setIsLoading(true);
        try {
            // Najpierw sprawdź uprawnienia
            const { data: authDebug, error: debugError } = await dbOperations.debugAuth();
            console.log('Auth debug pełny:', authDebug[0]);
            
            const dataToSend = {
                ...formData,
                planned_units: Number(formData.planned_units),
                actual_units: Number(formData.actual_units),
                created_by: authDebug[0].current_userid
            };

            console.log('Wysyłane dane pełne:', {
                ...dataToSend,
                currentUserId: authDebug[0].current_userid,
                userRole: authDebug[0].user_role,
                userExists: authDebug[0].user_exists,
                authValid: authDebug[0].auth_valid,
                policyCheck: authDebug[0].policy_check
            });

            const { error } = await dbOperations.addProductionData(dataToSend);
            
            if (error) {
                console.error('Szczegóły błędu pełne:', {
                    kod: error.code,
                    wiadomość: error.message,
                    szczegóły: error.details,
                    wskazówka: error.hint,
                    debug: authDebug[0],
                    wysłaneDane: dataToSend
                });
                throw error;
            }

            toast.success('Dane produkcyjne zostały dodane');
            reset();
            
            if (onDataAdded) {
                onDataAdded();
            }
        } catch (error) {
            console.error('Błąd dodawania danych:', error);
            toast.error(`Błąd podczas dodawania danych: ${error.message || 'Nieznany błąd'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">Wprowadź dane produkcyjne</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Data</span>
                        </label>
                        <input
                            type="date"
                            {...register('date')}
                            className="input input-bordered"
                        />
                        {errors.date && (
                            <span className="text-error text-sm">{errors.date.message}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Zmiana</span>
                        </label>
                        <select {...register('shift')} className="select select-bordered">
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
                            {...register('planned_units', { valueAsNumber: true })}
                            className="input input-bordered"
                        />
                        {errors.planned_units && (
                            <span className="text-error text-sm">{errors.planned_units.message}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Rzeczywista ilość</span>
                        </label>
                        <input
                            type="number"
                            {...register('actual_units', { valueAsNumber: true })}
                            className="input input-bordered"
                        />
                        {errors.actual_units && (
                            <span className="text-error text-sm">{errors.actual_units.message}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Typ produktu</span>
                        </label>
                        <input
                            type="text"
                            {...register('product_type')}
                            className="input input-bordered"
                        />
                        {errors.product_type && (
                            <span className="text-error text-sm">{errors.product_type.message}</span>
                        )}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Linia produkcyjna</span>
                        </label>
                        <select 
                            {...register('production_line_id')}
                            className="select select-bordered"
                            onChange={(e) => {
                                loadMachinesForLine(e.target.value);
                            }}
                        >
                            <option value="">Wybierz linię</option>
                            {productionLines.map(line => (
                                <option key={line.id} value={line.id}>
                                    {line.name}
                                </option>
                            ))}
                        </select>
                        {errors.production_line_id && (
                            <span className="text-error text-sm">{errors.production_line_id.message}</span>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Zapisywanie...' : 'Zapisz dane'}
                    </button>
                </form>
            </div>
        </div>
    );
} 