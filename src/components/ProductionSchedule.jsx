import React, { useState } from "react";

export default function ProductionSchedule({ scheduleData }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <div className="flex justify-between items-center mb-6">
          <h3 className="card-title">Harmonogram Produkcji</h3>
          <div className="flex gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input input-bordered"
            />
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Dodaj zadanie
            </button>
          </div>
        </div>

        {/* Tabela harmonogramu */}
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Godzina</th>
                <th>Produkt</th>
                <th>Ilość</th>
                <th>Linia</th>
                <th>Status</th>
                <th>Postęp</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((item) => (
                <tr key={item.id}>
                  <td>{item.time}</td>
                  <td>
                    <div className="font-bold">{item.product}</div>
                    <div className="text-sm opacity-50">{item.productCode}</div>
                  </td>
                  <td>
                    {item.completed}/{item.quantity} szt.
                  </td>
                  <td>{item.line}</td>
                  <td>
                    <div className={`badge ${
                      item.status === 'in_progress' ? 'badge-primary' :
                      item.status === 'completed' ? 'badge-success' :
                      item.status === 'delayed' ? 'badge-warning' :
                      'badge-ghost'
                    }`}>
                      {item.status === 'in_progress' ? 'W trakcie' :
                       item.status === 'completed' ? 'Zakończone' :
                       item.status === 'delayed' ? 'Opóźnione' :
                       'Planowane'}
                    </div>
                  </td>
                  <td>
                    <progress 
                      className="progress progress-primary w-full" 
                      value={item.completed} 
                      max={item.quantity}
                    ></progress>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-square btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="btn btn-square btn-sm btn-error">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal dodawania nowego zadania */}
        {showAddModal && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Dodaj nowe zadanie produkcyjne</h3>
              <form className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Produkt</span>
                  </label>
                  <input type="text" className="input input-bordered" />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Kod produktu</span>
                  </label>
                  <input type="text" className="input input-bordered" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Ilość</span>
                    </label>
                    <input type="number" className="input input-bordered" />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Linia produkcyjna</span>
                    </label>
                    <select className="select select-bordered">
                      <option>Linia A</option>
                      <option>Linia B</option>
                      <option>Linia C</option>
                    </select>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Godzina rozpoczęcia</span>
                  </label>
                  <input type="time" className="input input-bordered" />
                </div>
              </form>
              <div className="modal-action">
                <button className="btn" onClick={() => setShowAddModal(false)}>Anuluj</button>
                <button className="btn btn-primary">Zapisz</button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setShowAddModal(false)}>close</button>
            </form>
          </dialog>
        )}
      </div>
    </div>
  );
} 