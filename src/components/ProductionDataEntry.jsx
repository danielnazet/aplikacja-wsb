import React, { useState } from 'react';
import { useAuthStore } from '../lib/store';
import { dbOperations } from '../lib/db';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
    date: z.string(),
    shift: z.enum(['morning', 'afternoon', 'night']),
    planned_units: z.number().min(0),
    actual_units: z.number().min(0),
    product_type: z.string().min(1)
});

export default function ProductionDataEntry({ onDataAdded }) {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);

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
            product_type: ''
        }
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await dbOperations.addProductionData({
                ...data,
                created_by: user.id
            });
            toast.success('Dane produkcyjne zostały dodane');
            reset();
            
            if (onDataAdded) {
                onDataAdded();
            }
        } catch (error) {
            console.error('Błąd dodawania danych:', error);
            toast.error('Błąd podczas dodawania danych: ' + error.message);
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