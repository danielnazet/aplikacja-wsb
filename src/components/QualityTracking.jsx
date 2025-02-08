import React, { useState } from "react";

export default function QualityTracking({ qualityData }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const calculateDefectRate = (ok, nok) => {
    const total = ok + nok;
    return total > 0 ? ((nok / total) * 100).toFixed(1) : '0.0';
  };

  return (
    <div className="space-y-6">
      {/* Podsumowanie jakości */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="card-title">Podsumowanie Jakości</h3>
            <div className="flex gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input input-bordered"
              />
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddReportModal(true)}
              >
                Dodaj raport
              </button>
            </div>
          </div>

          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-title">Wyprodukowane OK</div>
              <div className="stat-value text-success">{qualityData.summary.totalOk}</div>
              <div className="stat-desc">jednostek</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Wadliwe (NOK)</div>
              <div className="stat-value text-error">{qualityData.summary.totalNok}</div>
              <div className="stat-desc">jednostek</div>
            </div>

            <div className="stat">
              <div className="stat-title">Wskaźnik wadliwości</div>
              <div className="stat-value">{calculateDefectRate(qualityData.summary.totalOk, qualityData.summary.totalNok)}%</div>
              <div className="stat-desc">Cel: max 2%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zakładki z raportami i kontrolami */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="tabs tabs-bordered">
            <a 
              className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              Raporty zmianowe
            </a>
            <a 
              className={`tab ${activeTab === 'controls' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('controls')}
            >
              Kontrole jakości
            </a>
          </div>

          {activeTab === 'summary' && (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Zmiana</th>
                    <th>Produkt</th>
                    <th>OK</th>
                    <th>NOK</th>
                    <th>Powody NOK</th>
                    <th>Operator</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData.reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.shift}</td>
                      <td>
                        <div className="font-bold">{report.product}</div>
                        <div className="text-sm opacity-50">{report.productCode}</div>
                      </td>
                      <td>{report.okCount}</td>
                      <td>{report.nokCount}</td>
                      <td>
                        {report.nokReasons.map((reason, index) => (
                          <div key={index} className="text-sm">
                            • {reason.reason}: {reason.count}
                          </div>
                        ))}
                      </td>
                      <td>{report.operator}</td>
                      <td>
                        <div className={`badge ${
                          report.status === 'completed' ? 'badge-success' :
                          report.status === 'in_progress' ? 'badge-warning' :
                          'badge-ghost'
                        }`}>
                          {report.status === 'completed' ? 'Zatwierdzony' :
                           report.status === 'in_progress' ? 'W trakcie' :
                           report.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Czas</th>
                    <th>Etap</th>
                    <th>Produkt</th>
                    <th>Parametr</th>
                    <th>Wynik</th>
                    <th>Limit</th>
                    <th>Kontroler</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityData.controls.map((control) => (
                    <tr key={control.id}>
                      <td>{control.time}</td>
                      <td>{control.stage}</td>
                      <td>
                        <div className="font-bold">{control.product}</div>
                        <div className="text-sm opacity-50">{control.productCode}</div>
                      </td>
                      <td>{control.parameter}</td>
                      <td>
                        <div className={`badge ${
                          control.result === 'pass' ? 'badge-success' :
                          control.result === 'fail' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {control.value} {control.unit}
                        </div>
                      </td>
                      <td>{control.limit}</td>
                      <td>{control.inspector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal dodawania raportu */}
      {showAddReportModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Dodaj raport jakościowy</h3>
            <form className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Produkt</span>
                </label>
                <select className="select select-bordered">
                  <option>Wspornik typu A</option>
                  <option>Zawias przemysłowy</option>
                  <option>Obudowa silnika</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ilość OK</span>
                  </label>
                  <input type="number" className="input input-bordered" />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ilość NOK</span>
                  </label>
                  <input type="number" className="input input-bordered" />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Powody NOK</span>
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select className="select select-bordered flex-1">
                      <option>Wymiary poza tolerancją</option>
                      <option>Wada powierzchni</option>
                      <option>Błąd montażu</option>
                    </select>
                    <input type="number" className="input input-bordered w-24" placeholder="Ilość" />
                  </div>
                  <button type="button" className="btn btn-outline btn-sm">+ Dodaj powód</button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Uwagi</span>
                </label>
                <textarea className="textarea textarea-bordered" rows="3"></textarea>
              </div>
            </form>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowAddReportModal(false)}>Anuluj</button>
              <button className="btn btn-primary">Zapisz</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowAddReportModal(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
} 