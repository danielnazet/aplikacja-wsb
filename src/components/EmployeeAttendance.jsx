import React, { useState } from "react";

export default function EmployeeAttendance({ attendanceData }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState('morning');

  const shifts = {
    morning: "6:00 - 14:00",
    afternoon: "14:00 - 22:00",
    night: "22:00 - 6:00"
  };

  return (
    <div className="space-y-6">
      {/* Formularz wejścia do pracy */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Rejestracja obecności</h3>
          <div className="flex gap-4 items-center">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCheckInModal(true)}
            >
              Zarejestruj wejście/wyjście
            </button>
            <div className="flex gap-2 items-center">
              <span>Zmiana:</span>
              <select 
                className="select select-bordered"
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
              >
                <option value="morning">Ranna (6:00 - 14:00)</option>
                <option value="afternoon">Popołudniowa (14:00 - 22:00)</option>
                <option value="night">Nocna (22:00 - 6:00)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista obecności */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="card-title">Lista obecności</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input input-bordered"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Pracownik</th>
                  <th>Zmiana</th>
                  <th>Wejście</th>
                  <th>Wyjście</th>
                  <th>Status</th>
                  <th>Przepracowane</th>
                  <th>Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img src={`https://ui-avatars.com/api/?name=${record.name}`} alt={record.name} />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">{record.name}</div>
                          <div className="text-sm opacity-50">{record.position}</div>
                        </div>
                      </div>
                    </td>
                    <td>{shifts[record.shift]}</td>
                    <td>{record.checkIn}</td>
                    <td>{record.checkOut || '-'}</td>
                    <td>
                      <div className={`badge ${
                        record.status === 'present' ? 'badge-success' :
                        record.status === 'late' ? 'badge-warning' :
                        record.status === 'absent' ? 'badge-error' :
                        'badge-ghost'
                      }`}>
                        {record.status === 'present' ? 'Obecny' :
                         record.status === 'late' ? 'Spóźniony' :
                         record.status === 'absent' ? 'Nieobecny' :
                         record.status}
                      </div>
                    </td>
                    <td>{record.hoursWorked || '-'}</td>
                    <td>{record.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal rejestracji */}
      {showCheckInModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Rejestracja czasu pracy</h3>
            <form className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Typ rejestracji</span>
                </label>
                <select className="select select-bordered">
                  <option value="checkIn">Wejście</option>
                  <option value="checkOut">Wyjście</option>
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Uwagi (opcjonalnie)</span>
                </label>
                <textarea className="textarea textarea-bordered" rows="3"></textarea>
              </div>
            </form>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowCheckInModal(false)}>Anuluj</button>
              <button className="btn btn-primary">Zatwierdź</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowCheckInModal(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
} 