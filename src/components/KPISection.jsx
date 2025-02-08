import React from "react";

export default function KPISection({ data }) {
  return (
    <div className="card bg-base-100 shadow-xl mb-6">
      <div className="card-body">
        <h3 className="card-title">Kluczowe Wskaźniki Wydajności (KPI)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Produkcja dzienna */}
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Produkcja na dziś</div>
            <div className="stat-value">{data.dailyProduction}</div>
            <div className="stat-desc">
              {data.productionTrend > 0 ? "↗" : "↘"} {Math.abs(data.productionTrend)}% vs wczoraj
            </div>
          </div>

          {/* Efektywność maszyn */}
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Efektywność maszyn (OEE)</div>
            <div className="stat-value">{data.oeePercentage}%</div>
            <div className="stat-desc">Cel: 85%</div>
          </div>

          {/* Czas przestojów */}
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Czas przestojów</div>
            <div className="stat-value">{data.downtimeHours}h</div>
            <div className="stat-desc">W ciągu ostatnich 24h</div>
          </div>

          {/* Realizacja celu */}
          <div className="stat bg-base-200 rounded-box p-4">
            <div className="stat-title">Realizacja celu</div>
            <div className="stat-value">{data.targetCompletion}%</div>
            <div className="stat-desc">
              Pozostało: {data.remainingUnits} jednostek
            </div>
          </div>
        </div>

        {/* Wykres słupkowy */}
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Cele vs. Rzeczywistość</h4>
          <div className="w-full h-24 bg-base-200 rounded-box p-4">
            <div className="flex items-end h-full gap-4">
              {data.productionComparison.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 h-full items-end">
                    <div
                      className="flex-1 bg-primary"
                      style={{ height: `${(item.actual / item.target) * 100}%` }}
                    ></div>
                    <div
                      className="flex-1 bg-secondary opacity-50"
                      style={{ height: `${(item.target / item.target) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary"></div>
              <span className="text-sm">Rzeczywista</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary opacity-50"></div>
              <span className="text-sm">Planowana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 