import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { dbOperations } from "../../lib";
import { toast } from "react-hot-toast";

export default function AnalyticsModule() {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState('financial');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await dbOperations.getAnalyticsData(dateRange.startDate, dateRange.endDate);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Błąd podczas ładowania danych analitycznych:", error);
      toast.error("Nie udało się załadować danych analitycznych");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        break;
    }

    setTimeRange(range);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const COLORS = ['#36D399', '#F87272', '#FBBD23', '#3ABFF8'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Błąd podczas ładowania danych analitycznych. Spróbuj odświeżyć stronę.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtry i przełączniki */}
      <div className="flex justify-between items-center">
        <div className="tabs tabs-boxed">
          <a 
            className={`tab ${activeTab === 'financial' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            Finanse
          </a>
          <a 
            className={`tab ${activeTab === 'trends' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Prognozy
          </a>
          <a 
            className={`tab ${activeTab === 'losses' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('losses')}
          >
            Analiza strat
          </a>
        </div>
        <select 
          className="select select-bordered"
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
        >
          <option value="week">Ostatni tydzień</option>
          <option value="month">Ostatni miesiąc</option>
          <option value="quarter">Ostatni kwartał</option>
          <option value="year">Ostatni rok</option>
        </select>
      </div>

      {/* Karty z podsumowaniem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Przychód</div>
          <div className="stat-value text-primary">{formatCurrency(analyticsData.summary.revenue)}</div>
          <div className="stat-desc">↗ {analyticsData.summary.revenueGrowth}% vs poprzedni okres</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Koszty</div>
          <div className="stat-value text-secondary">{formatCurrency(analyticsData.summary.costs)}</div>
          <div className="stat-desc">↘ {analyticsData.summary.costsReduction}% oszczędności</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">Marża</div>
          <div className="stat-value">{formatPercentage(analyticsData.summary.margin)}</div>
          <div className="stat-desc">Cel: {formatPercentage(analyticsData.summary.marginTarget)}</div>
        </div>
        <div className="stat bg-base-100 shadow">
          <div className="stat-title">ROI</div>
          <div className="stat-value">{formatPercentage(analyticsData.summary.roi)}</div>
          <div className="stat-desc">↗ {analyticsData.summary.roiGrowth}% wzrost</div>
        </div>
      </div>

      {/* Wykresy i analizy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'financial' && (
          <>
            {/* Wykres przychodów i kosztów */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Przychody vs Koszty</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.financial.revenueHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#36D399" name="Przychód" />
                      <Line type="monotone" dataKey="costs" stroke="#F87272" name="Koszty" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Struktura kosztów */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Struktura kosztów</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.financial.costStructure}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.financial.costStructure.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'trends' && (
          <>
            {/* Prognoza produkcji */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Prognoza produkcji</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.trends.productionForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual" stroke="#36D399" name="Aktualne" />
                      <Line type="monotone" dataKey="forecast" stroke="#3ABFF8" strokeDasharray="5 5" name="Prognoza" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Trendy wskaźników */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Trendy wskaźników</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.trends.kpiTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="efficiency" stroke="#36D399" name="Wydajność" />
                      <Line type="monotone" dataKey="quality" stroke="#3ABFF8" name="Jakość" />
                      <Line type="monotone" dataKey="utilization" stroke="#FBBD23" name="Wykorzystanie" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'losses' && (
          <>
            {/* Analiza przestojów */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Przyczyny przestojów</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.losses.downtimeReasons}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="reason" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hours" fill="#F87272" name="Godziny przestoju" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Analiza wadliwości */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title">Przyczyny wadliwości</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.losses.defectReasons}
                        dataKey="count"
                        nameKey="reason"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ reason, percent }) => `${reason} ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.losses.defectReasons.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 