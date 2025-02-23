import React, { useState, useEffect } from "react";
import { useAuthStore, dbOperations } from "../../lib";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

const formatDate = (date, viewMode) => {
  try {
    switch (viewMode) {
      case 'week':
        return new Intl.DateTimeFormat('pl-PL', { 
          weekday: 'short',
          day: 'numeric'
        }).format(date);
      case 'month':
        return new Intl.DateTimeFormat('pl-PL', { 
          day: 'numeric'
        }).format(date);
      case 'year':
        return new Intl.DateTimeFormat('pl-PL', { 
          month: 'short'
        }).format(date);
      default:
        return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.error('Błąd formatowania daty:', error);
    return date.toISOString().split('T')[0];
  }
};

// Komponent dla pojedynczego wykresu zmiany
const ShiftChart = ({ data, shift, title }) => (
  <div className="card bg-base-100 shadow-xl mb-6">
    <div className="card-body">
      <h3 className="card-title">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => {
                const type = name.includes('planned') ? 'Plan' : 'Wykonanie';
                return [value, type];
              }}
              labelFormatter={(label, data) => {
                if (!data?.[0]?.payload) return 'Brak danych';
                return new Intl.DateTimeFormat('pl-PL', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).format(new Date(data[0].payload.fullDate));
              }}
            />
            <Legend />
            <Bar 
              dataKey={`${shift}_planned`} 
              name="Plan" 
              fill="#8884d8" 
            />
            <Bar 
              dataKey={`${shift}_actual`} 
              name="Wykonanie" 
              fill="#82ca9d" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default function KPISection({ showOnlyDashboard = false }) {
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

      // Grupuj dane po dacie i zmianie
      const groupedData = data.reduce((acc, item) => {
        const dateStr = item.date;
        if (!acc[dateStr]) {
          acc[dateStr] = {
            date: dateStr,
            morning: { planned: 0, actual: 0 },
            afternoon: { planned: 0, actual: 0 },
            night: { planned: 0, actual: 0 }
          };
        }
        
        acc[dateStr][item.shift] = {
          planned: Number(item.planned_units),
          actual: Number(item.actual_units)
        };
        
        return acc;
      }, {});

      // Przygotuj dane do wykresu
      const allDays = [];
      const currentDay = new Date(startDate);

      while (currentDay <= endDate) {
        const dateStr = currentDay.toISOString().split('T')[0];
        const dayData = groupedData[dateStr] || {
          morning: { planned: 0, actual: 0 },
          afternoon: { planned: 0, actual: 0 },
          night: { planned: 0, actual: 0 }
        };

        // Formatuj datę w zależności od trybu widoku
        let displayDate = formatDate(currentDay, viewMode);

        allDays.push({
          displayDate,
          fullDate: dateStr,
          // Poranna zmiana
          morning_planned: dayData.morning.planned,
          morning_actual: dayData.morning.actual,
          // Popołudniowa zmiana
          afternoon_planned: dayData.afternoon.planned,
          afternoon_actual: dayData.afternoon.actual,
          // Nocna zmiana
          night_planned: dayData.night.planned,
          night_actual: dayData.night.actual
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Wskaźniki KPI</h2>
      
      {/* Statystyki */}
      <div className="stats shadow mb-6">
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

      {/* Kontrolki nawigacji */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                {viewMode === 'week' ? 'Widok tygodniowy' : 
                 viewMode === 'month' ? `${new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(currentDate)}` :
                 `Rok ${currentDate.getFullYear()}`}
              </p>
            </div>

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
        </div>
      </div>

      {/* Wykresy dla każdej zmiany */}
      <ShiftChart 
        data={productionData} 
        shift="morning" 
        title="Zmiana Poranna" 
      />
      <ShiftChart 
        data={productionData} 
        shift="afternoon" 
        title="Zmiana Popołudniowa" 
      />
      <ShiftChart 
        data={productionData} 
        shift="night" 
        title="Zmiana Nocna" 
      />
    </div>
  );
} 