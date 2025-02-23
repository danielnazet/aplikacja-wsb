import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { dbOperations } from '../../lib/db/db';

const schema = z.object({
    email: z.string().email('Nieprawidłowy adres email'),
    firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki'),
    lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki'),
    role: z.enum(['admin', 'foreman', 'worker'], 'Wybierz rolę'),
    password: z.string()
        .min(8, 'Hasło musi mieć co najmniej 8 znaków')
        .regex(/[A-Z]/, 'Hasło musi zawierać wielką literę')
        .regex(/[0-9]/, 'Hasło musi zawierać cyfrę')
});

export default function AddEmployeeModal({ show, onClose, onEmployeeAdded, editingEmployee }) {
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'worker',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingEmployee) {
            setFormData({
                email: editingEmployee.email,
                firstName: editingEmployee.first_name,
                lastName: editingEmployee.last_name,
                role: editingEmployee.role,
                password: '' // Nie pokazujemy hasła przy edycji
            });
        } else {
            setFormData({
                email: '',
                firstName: '',
                lastName: '',
                role: 'worker',
                password: ''
            });
        }
    }, [editingEmployee]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            const validatedData = schema.parse(formData);
            setLoading(true);

            if (editingEmployee) {
                await dbOperations.updateUser(editingEmployee.id, validatedData);
                toast.success('Pracownik został zaktualizowany');
            } else {
                await dbOperations.addUser(validatedData);
                toast.success('Pracownik został dodany');
            }

            onEmployeeAdded();
            setFormData({
                email: '',
                firstName: '',
                lastName: '',
                role: 'worker',
                password: ''
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors = {};
                error.errors.forEach(err => {
                    newErrors[err.path[0]] = err.message;
                });
                setErrors(newErrors);
            } else {
                console.error('Błąd dodawania/aktualizacji pracownika:', error);
                toast.error('Wystąpił błąd podczas zapisywania danych');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">
                    {editingEmployee ? 'Edytuj Pracownika' : 'Dodaj Nowego Pracownika'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Email</span>
                        </label>
                        <input
                            type="email"
                            className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={loading}
                        />
                        {errors.email && <span className="text-error text-sm mt-1">{errors.email}</span>}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Imię</span>
                        </label>
                        <input
                            type="text"
                            className={`input input-bordered ${errors.firstName ? 'input-error' : ''}`}
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={loading}
                        />
                        {errors.firstName && <span className="text-error text-sm mt-1">{errors.firstName}</span>}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Nazwisko</span>
                        </label>
                        <input
                            type="text"
                            className={`input input-bordered ${errors.lastName ? 'input-error' : ''}`}
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={loading}
                        />
                        {errors.lastName && <span className="text-error text-sm mt-1">{errors.lastName}</span>}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Rola</span>
                        </label>
                        <select
                            className={`select select-bordered ${errors.role ? 'select-error' : ''}`}
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            disabled={loading}
                        >
                            <option value="worker">Pracownik</option>
                            <option value="foreman">Brygadzista</option>
                            <option value="admin">Administrator</option>
                        </select>
                        {errors.role && <span className="text-error text-sm mt-1">{errors.role}</span>}
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">
                                {editingEmployee ? 'Nowe hasło (zostaw puste, aby nie zmieniać)' : 'Hasło'}
                            </span>
                        </label>
                        <input
                            type="password"
                            className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={loading}
                        />
                        {errors.password && <span className="text-error text-sm mt-1">{errors.password}</span>}
                    </div>

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {editingEmployee ? 'Zapisz zmiany' : 'Dodaj pracownika'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 
