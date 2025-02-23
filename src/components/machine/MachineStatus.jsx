import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../lib";
import { toast } from "react-hot-toast";
import { dbOperations } from '../../lib/db/db';

export default function MachineStatus({showOnlyDashboard = false}) {
  const [machines, setMachines] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOperator, setEditingOperator] = useState(null);
  const user = useAuthStore((state) => state.user);
  const [editingMachine, setEditingMachine] = useState(null);
  const [failureReason, setFailureReason] = useState("");
  const [kpiData, setKpiData] = useState({
    totalPlanned: 0,
    totalActual: 0,
    efficiency: 0,
    machineUtilization: 0
  });
  const [productionLines, setProductionLines] = useState([]);
  const [editingLine, setEditingLine] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [machinesData, workersData, productionData, linesData] = await Promise.all([
          dbOperations.getMachines(),
          dbOperations.getWorkers(),
          dbOperations.getProductionData(
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
          ),
          dbOperations.getProductionLines()
        ]);

        setMachines(machinesData);
        setWorkers(workersData);
        setProductionLines(linesData);

        const totalPlanned = productionData.reduce((sum, record) => sum + Number(record.planned_units), 0);
        const totalActual = productionData.reduce((sum, record) => sum + Number(record.actual_units), 0);
        const efficiency = totalPlanned > 0 ? (totalActual / totalPlanned * 100).toFixed(1) : 0;
        
        const workingMachines = machinesData.filter(m => m.status === 'working').length;
        const machineUtilization = (workingMachines / machinesData.length * 100).toFixed(1);

        setKpiData({
          totalPlanned,
          totalActual,
          efficiency,
          machineUtilization
        });

      } catch (error) {
        console.error('Błąd pobierania danych:', error);
        toast.error('Nie udało się pobrać danych');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const MachineStatusSummary = () => {
    const workingMachines = machines.filter(m => m.status === 'working').length;
    const serviceMachines = machines.filter(m => m.status === 'service').length;
    const failureMachines = machines.filter(m => m.status === 'failure').length;

    return (
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h3 className="card-title">Stan Maszyn</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Działające</div>
              <div className="stat-value text-success">{workingMachines}</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">W serwisie</div>
              <div className="stat-value text-warning">{serviceMachines}</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Awarie</div>
              <div className="stat-value text-error">{failureMachines}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading loading-spinner loading-lg"></div>;
  }

  if (showOnlyDashboard) {
    return <MachineStatusSummary />;
  }

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

  const handleStatusChange = async (machineId, newStatus) => {
    if (!user || (user.role !== 'admin' && user.role !== 'worker')) {
      toast.error('Brak uprawnień do zmiany statusu');
      return;
    }

    try {
      if (newStatus === 'failure') {
        setEditingMachine(machineId);
      } else {
        const updatedMachine = await dbOperations.updateMachineStatus(machineId, newStatus);
        setMachines(machines.map(m => m.id === machineId ? updatedMachine : m));
        toast.success(`Status maszyny został zmieniony na: ${getStatusText(newStatus)}`);
      }
    } catch (error) {
      console.error('Błąd aktualizacji statusu:', error);
      toast.error('Nie udało się zaktualizować statusu maszyny');
    }
  };

  const handleFailureSubmit = async (machineId) => {
    if (!failureReason.trim()) {
      toast.error('Podaj przyczynę awarii');
      return;
    }

    try {
      const updatedMachine = await dbOperations.updateMachineStatus(
        machineId,
        'failure',
        failureReason
      );
      setMachines(machines.map(m => m.id === machineId ? updatedMachine : m));
      setEditingMachine(null);
      setFailureReason("");
      toast.success('Status awarii został zaktualizowany');
    } catch (error) {
      console.error('Błąd aktualizacji awarii:', error);
      toast.error('Nie udało się zaktualizować statusu awarii');
    }
  };

  const handleOperatorChange = async (machineId, operatorId) => {
    try {
      const updatedMachine = await dbOperations.updateMachineOperator(machineId, operatorId);
      setMachines(machines.map(m => m.id === machineId ? updatedMachine : m));
      setEditingOperator(null);
      toast.success('Operator został zaktualizowany');
    } catch (error) {
      console.error('Błąd aktualizacji operatora:', error);
      toast.error('Nie udało się zaktualizować operatora');
    }
  };

  const handleClearFailureReason = async (machineId) => {
    try {
      const updatedMachine = await dbOperations.clearFailureReason(machineId);
      setMachines(machines.map(m => m.id === machineId ? updatedMachine : m));
      toast.success('Notatka o awarii została usunięta');
    } catch (error) {
      console.error('Błąd usuwania notatki:', error);
      toast.error('Nie udało się usunąć notatki o awarii');
    }
  };

  const handleLineChange = async (machineId, lineId) => {
    try {
      const updatedMachine = await dbOperations.updateMachineLine(machineId, lineId);
      setMachines(machines.map(m => m.id === machineId ? updatedMachine : m));
      setEditingLine(null);
      toast.success('Linia produkcyjna została zaktualizowana');
    } catch (error) {
      console.error('Błąd aktualizacji linii:', error);
      toast.error('Nie udało się zaktualizować linii produkcyjnej');
    }
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <MachineStatusSummary />
        <h3 className="card-title flex justify-between items-center">
          Stan Maszyn
          <div className="flex gap-2">
            <span className="badge badge-success">
              Działające: {machines.filter(m => m.status === 'working').length}
            </span>
            <span className="badge badge-warning">
              Serwis: {machines.filter(m => m.status === 'service').length}
            </span>
            <span className="badge badge-error">
              Awarie: {machines.filter(m => m.status === 'failure').length}
            </span>
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
                  <div className="flex justify-between items-center">
                    <span>Operator:</span>
                    {editingOperator === machine.id ? (
                      <select
                        className="select select-sm select-bordered"
                        value={machine.operator?.id || ''}
                        onChange={(e) => handleOperatorChange(machine.id, e.target.value)}
                      >
                        <option value="">Wybierz operatora</option>
                        {workers.map(worker => (
                          <option key={worker.id} value={worker.id}>
                            {worker.first_name} {worker.last_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>
                          {machine.operator ? 
                            `${machine.operator.first_name} ${machine.operator.last_name}` : 
                            'Brak operatora'}
                        </span>
                        {(user?.role === 'admin' || user?.role === 'foreman') && (
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setEditingOperator(machine.id)}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Linia produkcyjna:</span>
                    {editingLine === machine.id ? (
                      <select
                        className="select select-sm select-bordered"
                        value={machine.production_line_id || ''}
                        onChange={(e) => handleLineChange(machine.id, e.target.value)}
                      >
                        <option value="">Brak przypisania</option>
                        {productionLines.map(line => (
                          <option key={line.id} value={line.id}>
                            {line.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>
                          {productionLines.find(l => l.id === machine.production_line_id)?.name || 'Brak przypisania'}
                        </span>
                        {(user?.role === 'admin' || user?.role === 'foreman') && (
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setEditingLine(machine.id)}
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div>Ostatni przegląd: {machine.last_service}</div>
                  {machine.failure_reason && (
                    <div className="mt-2 text-error">
                      <div className="flex justify-between items-center">
                        <span>Problem: {machine.failure_reason}</span>
                        {(user?.role === 'admin' || user?.role === 'worker') && (
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => handleClearFailureReason(machine.id)}
                            title="Usuń notatkę o awarii"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {(user?.role === 'admin' || user?.role === 'worker') && (
                  <div className="card-actions justify-end mt-2">
                    {editingMachine === machine.id ? (
                      <div className="w-full mt-2">
                        <input
                          type="text"
                          placeholder="Opisz przyczynę awarii"
                          className="input input-bordered w-full mb-2"
                          value={failureReason}
                          onChange={(e) => setFailureReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => {
                              setEditingMachine(null);
                              setFailureReason("");
                            }}
                          >
                            Anuluj
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleFailureSubmit(machine.id)}
                          >
                            Zatwierdź
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {machine.status !== 'working' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleStatusChange(machine.id, 'working')}
                          >
                            Działa
                          </button>
                        )}
                        {machine.status !== 'service' && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleStatusChange(machine.id, 'service')}
                          >
                            Serwis
                          </button>
                        )}
                        {machine.status !== 'failure' && (
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => handleStatusChange(machine.id, 'failure')}
                          >
                            Awaria
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 