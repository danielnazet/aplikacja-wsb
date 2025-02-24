import React, { useState, useEffect } from "react";
import { useAuthStore, dbOperations, getSupabase } from "../../lib";
import { toast } from 'react-hot-toast';

export default function EmployeeAttendance() {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const user = useAuthStore(state => state.user);
    const [selectedWorker, setSelectedWorker] = useState('all');
    const [workers, setWorkers] = useState([]);

    useEffect(() => {
        const loadWorkers = async () => {
            try {
                const workersData = await dbOperations.getWorkers();
                setWorkers(workersData);
            } catch (error) {
                console.error('Błąd pobierania pracowników:', error);
                toast.error('Nie udało się pobrać listy pracowników');
            }
        };

        if (user?.role === 'admin' || user?.role === 'foreman') {
            loadWorkers();
        }
    }, [user]);

    useEffect(() => {
        loadAttendanceData();
    }, [selectedDate, selectedWorker]);

    const loadAttendanceData = async () => {
        try {
            setLoading(true);
            const [workersData, attendanceRecords] = await Promise.all([
                dbOperations.getWorkers(),
                dbOperations.getAttendance(selectedDate)
            ]);

            let filteredWorkersData = workersData;
            if (!canEditOthers) {
                // Jeśli to zwykły pracownik, pokaż tylko jego rekord
                filteredWorkersData = workersData.filter(w => w.id === user.id);
            } else if (selectedWorker !== 'all') {
                // Dla admina/brygadzisty z wybranym pracownikiem
                filteredWorkersData = workersData.filter(w => w.id === selectedWorker);
            }

            const combinedData = filteredWorkersData.map(worker => {
                const attendance = attendanceRecords.find(a => a.user_id === worker.id) || {};
                return {
                    id: worker.id,
                    name: `${worker.first_name} ${worker.last_name}`,
                    position: worker.role,
                    shift: attendance.shift || "morning",
                    checkIn: attendance.check_in,
                    checkOut: attendance.check_out,
                    status: attendance.status || "absent",
                    notes: attendance.notes || ""
                };
            });

            setAttendanceData(combinedData);
        } catch (error) {
            console.error('Błąd ładowania danych:', error);
            toast.error('Nie udało się załadować danych obecności');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (workerId, newStatus) => {
        try {
            const record = attendanceData.find(r => r.id === workerId);
            
            // Pobierz istniejący rekord z bazy
            const supabase = getSupabase();
            const { data: existingRecord } = await supabase
                .from('attendance')
                .select('id')
                .eq('user_id', workerId)
                .eq('date', selectedDate)
                .eq('shift', record.shift)
                .single();

            if (existingRecord) {
                // Jeśli rekord istnieje, zaktualizuj go
                await dbOperations.updateAttendanceRecord(existingRecord.id, {
                    status: newStatus,
                    checkIn: record.checkIn,
                    checkOut: record.checkOut,
                    notes: record.notes,
                    shift: record.shift
                });
            } else {
                // Jeśli nie istnieje, utwórz nowy
                const updatedRecord = {
                    shift: record.shift,
                    status: newStatus,
                    checkIn: newStatus === 'present' ? new Date().toISOString() : null,
                    checkOut: newStatus === 'absent' ? new Date().toISOString() : null,
                    notes: record.notes || ''
                };
                await dbOperations.updateAttendance(workerId, updatedRecord);
            }

            await loadAttendanceData(); // Odśwież dane
            toast.success('Status obecności zaktualizowany');
        } catch (error) {
            console.error('Błąd aktualizacji statusu:', error);
            toast.error('Nie udało się zaktualizować statusu');
        }
    };

    const handleNotesChange = (workerId, notes) => {
        setAttendanceData(currentData =>
            currentData.map(record =>
                record.id === workerId
                    ? { ...record, notes }
                    : record
            )
        );
    };

    const handleClockIn = async (workerId) => {
        try {
            const updatedRecord = {
                shift: attendanceData.find(r => r.id === workerId).shift,
                status: 'present',
                checkIn: new Date().toISOString(),
                checkOut: null,
                notes: ''
            };

            await dbOperations.updateAttendance(workerId, updatedRecord);
            await loadAttendanceData();
            toast.success('Zarejestrowano przyjście do pracy');
        } catch (error) {
            console.error('Błąd rejestracji przyjścia:', error);
            toast.error('Nie udało się zarejestrować przyjścia');
        }
    };

    const handleClockOut = async (workerId) => {
        try {
            const record = attendanceData.find(r => r.id === workerId);
            const updatedRecord = {
                ...record,
                status: 'absent',
                checkOut: new Date().toISOString(),
                shift: record.shift
            };

            // Pobierz istniejący rekord z bazy
            const supabase = getSupabase();
            const { data: existingRecord } = await supabase
                .from('attendance')
                .select('id')
                .eq('user_id', workerId)
                .eq('date', new Date().toISOString().split('T')[0])
                .eq('shift', record.shift)
                .single();

            if (existingRecord) {
                // Jeśli rekord istnieje, zaktualizuj go
                await dbOperations.updateAttendanceRecord(existingRecord.id, {
                    status: 'absent',
                    checkIn: record.checkIn,
                    checkOut: new Date().toISOString(),
                    notes: record.notes,
                    shift: record.shift
                });
            } else {
                // Jeśli nie istnieje, utwórz nowy
                await dbOperations.updateAttendance(workerId, updatedRecord);
            }

            await loadAttendanceData();
            toast.success('Zarejestrowano wyjście z pracy');
        } catch (error) {
            console.error('Błąd rejestracji wyjścia:', error);
            toast.error('Nie udało się zarejestrować wyjścia');
        }
    };

    // Dodaj funkcję obliczającą przepracowany czas
    const calculateWorkedTime = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '-';
        
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffInMinutes = Math.floor((end - start) / (1000 * 60));
        
        const hours = Math.floor(diffInMinutes / 60);
        const minutes = diffInMinutes % 60;
        
        return `${hours}h ${minutes}min`;
    };

    // Zmodyfikuj warunek sprawdzający czy użytkownik może widzieć swój rekord
    const canSeeOwnRecord = user?.role === 'worker' || user?.role === 'foreman';
    
    // Zmodyfikuj warunek sprawdzający czy użytkownik może edytować inne rekordy
    const canEditOthers = user?.role === 'admin' || user?.role === 'foreman';

    // Dodaj funkcję pomocniczą do tłumaczenia stanowisk
    const getPositionTranslation = (position) => {
        switch (position) {
            case 'admin': return 'Administrator';
            case 'foreman': return 'Brygadzista';
            case 'worker': return 'Pracownik';
            default: return position;
        }
    };

    if (loading) {
        return <div className="flex justify-center p-4">Ładowanie...</div>;
    }

  return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Lista Obecności</h2>
                <div className="flex items-center gap-4">
                    {canEditOthers && (
              <select 
                            className="select select-bordered select-sm"
                            value={selectedWorker}
                            onChange={(e) => setSelectedWorker(e.target.value)}
                        >
                            <option value="all">Wszyscy pracownicy</option>
                            {workers.map(worker => (
                                <option key={worker.id} value={worker.id}>
                                    {worker.first_name} {worker.last_name}
                                </option>
                            ))}
              </select>
                    )}
            <input
              type="date"
                        className="input input-bordered input-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
            />
                </div>
          </div>

            <div className="bg-base-100 rounded-lg shadow-lg">
          <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Pracownik</th>
                                <th>Stanowisko</th>
                  <th>Zmiana</th>
                                <th>Status</th>
                  <th>Wejście</th>
                  <th>Wyjście</th>
                  <th>Przepracowane</th>
                  <th>Uwagi</th>
                                <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                            {attendanceData.map(record => (
                                <tr key={record.id} className="hover">
                                    <td className="font-medium">{record.name}</td>
                                    <td>{getPositionTranslation(record.position)}</td>
                                    <td>
                                        <select 
                                            className="select select-bordered select-sm w-full max-w-xs"
                                            value={record.shift}
                                            onChange={(e) => {
                                                setAttendanceData(currentData =>
                                                    currentData.map(r =>
                                                        r.id === record.id
                                                            ? { ...r, shift: e.target.value }
                                                            : r
                                                    )
                                                );
                                            }}
                                            disabled={!canEditOthers}
                                        >
                                            <option value="morning">Ranna</option>
                                            <option value="afternoon">Popołudniowa</option>
                                            <option value="night">Nocna</option>
                                        </select>
                    </td>
                    <td>
                                        <span className={`badge ${
                        record.status === 'present' ? 'badge-success' :
                        record.status === 'absent' ? 'badge-error' :
                                            'badge-warning'
                                        } badge-sm`}>
                        {record.status === 'present' ? 'Obecny' :
                         record.status === 'absent' ? 'Nieobecny' :
                                             'Spóźniony'}
                                        </span>
                                    </td>
                                    <td className="text-sm">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                                    <td className="text-sm">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                                    <td className="text-sm">{calculateWorkedTime(record.checkIn, record.checkOut)}</td>
                                    <td>
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm w-full max-w-xs"
                                            value={record.notes}
                                            onChange={(e) => handleNotesChange(record.id, e.target.value)}
                                            placeholder="Dodaj uwagi..."
                                            disabled={!canEditOthers && record.id !== user.id}
                                        />
                                    </td>
                                    <td>
                                        {record.id === user.id && canSeeOwnRecord ? (
                                            // Przyciski dla własnego rekordu (pracownik i brygadzista)
                                            <div className="flex gap-2">
                                                {!record.checkIn && (
                                                    <button
                                                        className="btn btn-xs btn-success"
                                                        onClick={() => handleClockIn(record.id)}
                                                    >
                                                        Przyjście
                                                    </button>
                                                )}
                                                {record.checkIn && !record.checkOut && (
                                                    <button
                                                        className="btn btn-xs btn-warning"
                                                        onClick={() => handleClockOut(record.id)}
                                                    >
                                                        Wyjście
                                                    </button>
                                                )}
                                            </div>
                                        ) : canEditOthers ? (
                                            // Przyciski dla innych rekordów (admin i brygadzista)
                                            <div className="flex gap-1">
                                                <button
                                                    className="btn btn-xs btn-success"
                                                    onClick={() => handleStatusChange(record.id, 'present')}
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-error"
                                                    onClick={() => handleStatusChange(record.id, 'absent')}
                                                >
                                                    ✗
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-warning"
                                                    onClick={() => handleStatusChange(record.id, 'late')}
                                                >
                                                    ⌚
                                                </button>
                      </div>
                                        ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
} 