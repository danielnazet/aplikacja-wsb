import React from "react";

export default function MachineStatus({ machines }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "working":
        return "bg-success";
      case "service":
        return "bg-warning";
      case "failure":
        return "bg-error";
      default:
        return "bg-base-300";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "working":
        return "Działa";
      case "service":
        return "Serwis";
      case "failure":
        return "Awaria";
      default:
        return "Nieznany";
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title flex justify-between items-center">
          Stan Maszyn
          <div className="flex gap-2">
            <span className="badge badge-success">Działające: {machines.filter(m => m.status === 'working').length}</span>
            <span className="badge badge-warning">Serwis: {machines.filter(m => m.status === 'service').length}</span>
            <span className="badge badge-error">Awarie: {machines.filter(m => m.status === 'failure').length}</span>
          </div>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((machine) => (
            <div key={machine.id} className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold">{machine.name}</h4>
                  <div className={`badge ${getStatusColor(machine.status)}`}>
                    {getStatusText(machine.status)}
                  </div>
                </div>
                <p className="text-sm opacity-70">{machine.description}</p>
                <div className="text-sm mt-2">
                  <div>Operator: {machine.operator}</div>
                  <div>Ostatni przegląd: {machine.lastService}</div>
                </div>
                {machine.status === 'failure' && (
                  <div className="mt-2 text-sm text-error">
                    Problem: {machine.failureReason}
                  </div>
                )}
                <div className="card-actions justify-end mt-2">
                  <button className="btn btn-sm btn-primary">Szczegóły</button>
                  {machine.status !== 'working' && (
                    <button className="btn btn-sm btn-outline">Zgłoś naprawę</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 