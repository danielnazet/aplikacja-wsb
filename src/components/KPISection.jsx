import React, { useState, useEffect } from "react";
import { useAuthStore } from '../lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dbOperations } from '../lib/db';
import ProductionDataEntry from './ProductionDataEntry';
import { toast } from 'react-hot-toast';

export default function KPISection({showProductionForm = false, showOnlyDashboard = false
 }) {
  const [productionData, setProductionData] = useState([]);
  const user = useAuthStore(state => state.user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week', 'month', 'year'
  const [kpiStats, setKpiStats] = useState({
    totalPlanned: 0,
    totalActual: 0,
    efficiency: 0,
    machineUtilization: 0
  });

  useEffect(() => {
    // Ustaw początkową datę na koniec bieżącego tygodnia
    const today = new Date();
    setCurrentDate(today);
    setViewMode('week'); // Wymuszamy widok tygodniowy na starcie
  }, []); // Pusty array dependencies - wykonaj tylko raz przy montowaniu komponentu

  const fetchData = async (startDate, endDate) => {
    try {
      const data = await dbOperations.getProductionData(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Przygotuj dane do wykresu
      const allDays = [];
      const currentDay = new Date(startDate);

      while (currentDay <= endDate) {
        const dateStr = currentDay.toISOString().split('T')[0];
        const existingData = data.find(d => d.date === dateStr) || {
          date: dateStr,
          planned_units: 0,
          actual_units: 0
        };

        // Formatuj datę w zależności od trybu widoku
        let displayDate;
        try {
          switch (viewMode) {
            case 'week':
              displayDate = new Intl.DateTimeFormat('pl-PL', { 
                weekday: 'short',
                day: 'numeric'
              }).format(currentDay);
              break;
            case 'month':
              displayDate = new Intl.DateTimeFormat('pl-PL', { 
                day: 'numeric'
              }).format(currentDay);
              break;
            case 'year':
              displayDate = new Intl.DateTimeFormat('pl-PL', { 
                month: 'short'
              }).format(currentDay);
              break;
            default:
              displayDate = dateStr;
          }
        } catch (error) {
          console.error('Błąd formatowania daty:', error);
          displayDate = dateStr;
        }

        allDays.push({
          ...existingData,
          displayDate,
          fullDate: dateStr,
          planned_units: Number(existingData.planned_units) || 0,
          actual_units: Number(existingData.actual_units) || 0
        });

        currentDay.setDate(currentDay.getDate() + 1);
      }

      setProductionData(allDays);
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      toast.error('Nie udało się pobrać danych produkcyjnych');
      setProductionData([]);
    }
  };

  useEffect(() => {
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);

    switch (viewMode) {
      case 'week':
        startDate.setDate(currentDate.getDate() - 6);
        break;
      case 'month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0); // Ostatni dzień miesiąca
        break;
      case 'year':
        startDate.setMonth(0, 1); // 1 stycznia
        endDate.setMonth(11, 31); // 31 grudnia
        break;
    }

    fetchData(startDate, endDate);
  }, [currentDate, viewMode]);

  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction);
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + direction);
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getPeriodLabel = () => {
    const formatter = new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: viewMode !== 'year' ? 'long' : undefined,
      day: viewMode === 'week' ? 'numeric' : undefined
    });

    if (viewMode === 'week') {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 6);
      return `${formatter.format(startDate)} - ${formatter.format(currentDate)}`;
    }

    return formatter.format(currentDate);
  };

  const KPIHistory = ({ startDate, endDate }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 100;

    useEffect(() => {
      const fetchHistory = async () => {
        try {
          setLoading(true);
          const { data, count } = await dbOperations.getProductionDataHistory(
            startDate, 
            endDate,
            page,
            itemsPerPage
          );
          setHistory(data);
          setTotalPages(Math.ceil(count / itemsPerPage));
        } catch (error) {
          console.error('Błąd pobierania historii:', error);
          toast.error('Nie udało się pobrać historii zmian');
        } finally {
          setLoading(false);
        }
      };

      fetchHistory();
    }, [startDate, endDate, page]);

    if (loading) {
      return <div className="text-center py-4">Ładowanie historii...</div>;
    }

    return (
      <div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="table table-zebra w-full">
            <thead className="sticky top-0 bg-base-100">
              <tr>
                <th>Data zmiany</th>
                <th>Użytkownik</th>
                <th>Akcja</th>
                <th>Data produkcji</th>
                <th>Zmiana</th>
                <th>Plan</th>
                <th>Wykonanie</th>
                <th>Produkt</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Brak historii dla wybranego okresu
                  </td>
                </tr>
              ) : (
                history.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.created_at).toLocaleString('pl-PL')}</td>
                    <td>{`${record.user.first_name} ${record.user.last_name}`}</td>
                    <td>
                      {record.action === 'create' ? 'Dodano' : 
                       record.action === 'update' ? 'Zaktualizowano' : 'Usunięto'}
                    </td>
                    <td>{record.production_data.date}</td>
                    <td>
                      {record.production_data.shift === 'morning' ? 'Ranna' :
                       record.production_data.shift === 'afternoon' ? 'Popołudniowa' : 'Nocna'}
                    </td>
                    <td>{record.production_data.planned_units}</td>
                    <td>{record.production_data.actual_units}</td>
                    <td>{record.production_data.product_type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginacja */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button 
              className="btn btn-sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Poprzednia
            </button>
            <span className="py-1">
              Strona {page} z {totalPages}
            </span>
            <button 
              className="btn btn-sm" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Następna
            </button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const calculateKPIs = async () => {
      try {
        // Pobierz dane produkcyjne z ostatnich 30 dni
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const [productionData, machinesData] = await Promise.all([
          dbOperations.getProductionData(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ),
          dbOperations.getMachines()
        ]);

        // Oblicz statystyki
        const totalPlanned = productionData.reduce((sum, record) => sum + Number(record.planned_units), 0);
        const totalActual = productionData.reduce((sum, record) => sum + Number(record.actual_units), 0);
        const efficiency = totalPlanned > 0 ? (totalActual / totalPlanned * 100).toFixed(1) : 0;
        
        const workingMachines = machinesData.filter(m => m.status === 'working').length;
        const machineUtilization = (workingMachines / machinesData.length * 100).toFixed(1);

        setKpiStats({
          totalPlanned,
          totalActual,
          efficiency,
          machineUtilization
        });
      } catch (error) {
        console.error('Błąd pobierania danych KPI:', error);
        toast.error('Nie udało się pobrać danych KPI');
      }
    };

    calculateKPIs();
  }, [productionData]); // Przelicz gdy zmienią się dane produkcyjne

  if (showOnlyDashboard) {
    return (
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h3 className="card-title">Kluczowe Wskaźniki Wydajności (KPI)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Zaplanowana produkcja (30 dni)</div>
              <div className="stat-value">{kpiStats.totalPlanned}</div>
              <div className="stat-desc">Suma zaplanowanych jednostek</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Wykonana produkcja (30 dni)</div>
              <div className="stat-value">{kpiStats.totalActual}</div>
              <div className="stat-desc">Suma wykonanych jednostek</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Wydajność produkcji</div>
              <div className="stat-value">{kpiStats.efficiency}%</div>
              <div className="stat-desc">Wykonanie vs Plan</div>
            </div>
            <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Wykorzystanie maszyn</div>
              <div className="stat-value">{kpiStats.machineUtilization}%</div>
              <div className="stat-desc">Maszyny działające/wszystkie</div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Sekcja KPI */}
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title">Kluczowe Wskaźniki Wydajności (KPI)</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Zaplanowana produkcja (30 dni)</div>
              <div className="stat-value">{kpiStats.totalPlanned}</div>
              <div className="stat-desc">Suma zaplanowanych jednostek</div>
            </div>
          <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Wykonana produkcja (30 dni)</div>
              <div className="stat-value">{kpiStats.totalActual}</div>
              <div className="stat-desc">Suma wykonanych jednostek</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Wydajność produkcji</div>
              <div className="stat-value">{kpiStats.efficiency}%</div>
              <div className="stat-desc">Wykonanie vs Plan</div>
          </div>
          <div className="stat bg-base-200 rounded-box p-4">
              <div className="stat-title">Wykorzystanie maszyn</div>
              <div className="stat-value">{kpiStats.machineUtilization}%</div>
              <div className="stat-desc">Maszyny działające/wszystkie</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wykres produkcji */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Produkcja dzienna - Plan vs Wykonanie</h3>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">
                {viewMode === 'week' ? 'Widok tygodniowy' : 
                 viewMode === 'month' ? `${new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(currentDate)}` :
                 `Rok ${currentDate.getFullYear()}`}
              </p>
        </div>

            {/* Kontrolki nawigacji */}
            <div className="flex items-center gap-4">
              <div className="btn-group">
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
                <button 
                  className={`btn btn-sm ${viewMode === 'year' ? 'btn-active' : ''}`}
                  onClick={() => setViewMode('year')}
                >
                  Rok
                </button>
                  </div>

              <div className="btn-group">
                <button 
                  className="btn btn-sm"
                  onClick={() => navigate(-1)}
                >
                  ←
                </button>
                <button className="btn btn-sm">
                  {getPeriodLabel()}
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={() => navigate(1)}
                  disabled={currentDate >= new Date()}
                >
                  →
                </button>
                </div>
            </div>
          </div>

          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayDate" 
                  angle={viewMode === 'month' ? -45 : 0}
                  textAnchor={viewMode === 'month' ? 'end' : 'middle'}
                  height={viewMode === 'month' ? 60 : 30}
                  interval={viewMode === 'year' ? 30 : 0} // Dla roku pokazuj co miesiąc
                  tick={{ fontSize: viewMode === 'month' ? 10 : 12 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'planned_units' ? 'Plan' : 'Wykonanie']}
                  labelFormatter={(_, data) => {
                    if (!data || !data[0] || !data[0].payload) {
                      return 'Brak danych';
                    }
                    const record = data[0].payload;
                    try {
                      return new Intl.DateTimeFormat('pl-PL', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }).format(new Date(record.fullDate));
                    } catch (error) {
                      console.error('Błąd formatowania daty:', error);
                      return 'Nieprawidłowa data';
                    }
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="planned_units" 
                  name="Plan" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="actual_units" 
                  name="Wykonanie" 
                  fill="#82ca9d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>

          {/* Przyciski eksportu */}
          <div className="flex justify-between mt-4">
            <button 
              className="btn btn-primary"
              onClick={() => {
                const startDate = new Date(currentDate);
                const endDate = new Date(currentDate);
                
                switch (viewMode) {
                  case 'week':
                    startDate.setDate(currentDate.getDate() - 6);
                    break;
                  case 'month':
                    startDate.setDate(1);
                    endDate.setMonth(endDate.getMonth() + 1, 0);
                    break;
                  case 'year':
                    startDate.setMonth(0, 1);
                    endDate.setMonth(11, 31);
                    break;
                }
                
                dbOperations.exportProductionData(
                  startDate.toISOString().split('T')[0],
                  endDate.toISOString().split('T')[0]
                );
              }}
            >
              Eksportuj {viewMode === 'week' ? 'tydzień' : viewMode === 'month' ? 'miesiąc' : 'rok'} do CSV
            </button>
          </div>
        </div>
      </div>

      {/* Formularz wprowadzania danych */}
      {showProductionForm && (user?.role === 'admin' || user?.role === 'worker') && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Wprowadź dane produkcyjne</h3>
            <ProductionDataEntry onDataAdded={async () => {
              // Pobierz aktualny zakres dat
              const startDate = new Date(currentDate);
              const endDate = new Date(currentDate);

              switch (viewMode) {
                case 'week':
                  startDate.setDate(currentDate.getDate() - 6);
                  break;
                case 'month':
                  startDate.setDate(1);
                  endDate.setMonth(endDate.getMonth() + 1, 0);
                  break;
                case 'year':
                  startDate.setMonth(0, 1);
                  endDate.setMonth(11, 31);
                  break;
              }

              // Odśwież dane
              await fetchData(startDate, endDate);
            }} />
          </div>
        </div>
      )}

      {/* Historia zmian */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Historia wprowadzonych danych</h3>
          <KPIHistory 
            startDate={(() => {
              const startDate = new Date(currentDate);
              switch (viewMode) {
                case 'week':
                  startDate.setDate(currentDate.getDate() - 6);
                  break;
                case 'month':
                  startDate.setDate(1);
                  break;
                case 'year':
                  startDate.setMonth(0, 1);
                  break;
              }
              return startDate.toISOString();
            })()}
            endDate={(() => {
              const endDate = new Date(currentDate);
              switch (viewMode) {
                case 'month':
                  endDate.setMonth(endDate.getMonth() + 1, 0);
                  break;
                case 'year':
                  endDate.setMonth(11, 31);
                  break;
              }
              return endDate.toISOString();
            })()}
          />
        </div>
      </div>
    </div>
  );
} 