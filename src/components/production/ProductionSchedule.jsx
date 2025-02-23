import React, { useState, useEffect } from "react";
import ProductionDataEntry from './ProductionDataEntry';
import { useAuthStore, dbOperations } from "../../lib";
import KPIHistory from '../kpi/KPIHistory';
import { toast } from "react-hot-toast";

export default function ProductionSchedule() {
  const user = useAuthStore(state => state.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [productionLines, setProductionLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState('all');
  const [scheduleData, setScheduleData] = useState([]);

  // Pobierz linie produkcyjne przy ładowaniu
  useEffect(() => {
    const loadProductionLines = async () => {
      try {
        const lines = await dbOperations.getProductionLines();
        setProductionLines(lines);
      } catch (error) {
        console.error('Błąd ładowania linii:', error);
        toast.error('Nie udało się załadować linii produkcyjnych');
      }
    };

    loadProductionLines();
  }, []);

  // Dodaj funkcję loadScheduleData
  const loadScheduleData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      const data = await dbOperations.getProductionData(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setScheduleData(data);
    } catch (error) {
      console.error('Błąd ładowania danych:', error);
      toast.error('Nie udało się załadować danych harmonogramu');
    }
  };

  // Dodaj useEffect do ładowania danych przy montowaniu komponentu
  useEffect(() => {
    loadScheduleData();
  }, [selectedDate, viewMode]);

  const getDateRange = () => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);

    switch (viewMode) {
      case 'day':
        return { startDate, endDate };
      case 'week':
        startDate.setDate(selectedDate.getDate() - 6);
        return { startDate, endDate };
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        return { startDate, endDate };
      default:
        return { startDate, endDate };
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Harmonogram Produkcji</h2>
      
      {/* Kontrolki nawigacji */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="btn-group">
              <button 
                className={`btn btn-sm ${viewMode === 'day' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('day')}
              >
                Dzień
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'week' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Tydzień
              </button>
              <button 
                className={`btn btn-sm ${viewMode === 'month' ? 'btn-active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                Miesiąc
              </button>
            </div>

            {/* Wybór linii produkcyjnej */}
            <select 
              className="select select-bordered select-sm"
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
            >
              <option value="all">Wszystkie linie</option>
              {productionLines.map(line => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-4">
              <input
                type="date"
                className="input input-bordered input-sm"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wyświetlanie harmonogramu */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h3 className="card-title">Harmonogram</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Zmiana</th>
                  <th>Linia</th>
                  <th>Produkt</th>
                  <th>Plan</th>
                  <th>Wykonanie</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((item, index) => {
                  const line = productionLines.find(l => l.id === item.production_line_id);
                  const completion = (item.actual_units / item.planned_units * 100).toFixed(0);
                  
                  return (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.shift === 'morning' ? 'Ranna' : 
                           item.shift === 'afternoon' ? 'Popołudniowa' : 'Nocna'}</td>
                      <td>{line?.name || 'Nieznana'}</td>
                      <td>{item.product_type}</td>
                      <td>{item.planned_units}</td>
                      <td>{item.actual_units}</td>
                      <td>
                        <div className="badge" 
                             style={{
                               backgroundColor: completion >= 100 ? '#4CAF50' : 
                                              completion >= 80 ? '#FFC107' : '#F44336',
                               color: 'white'
                             }}>
                          {completion}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Formularz wprowadzania danych */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h3 className="card-title">Wprowadź dane produkcyjne</h3>
          <ProductionDataEntry 
            onDataAdded={loadScheduleData} // przekazujemy funkcję odświeżania
          />
        </div>
      </div>

      {/* Historia produkcji */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h3 className="card-title">Historia produkcji</h3>
          <KPIHistory 
            startDate={getDateRange().startDate.toISOString()}
            endDate={getDateRange().endDate.toISOString()}
          />
        </div>
      </div>

      {/* Plan produkcji */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Plan produkcji</h3>
          {/* TODO: Dodać komponenty do wyświetlania harmonogramu */}
        </div>
      </div>
    </div>
  );
} 