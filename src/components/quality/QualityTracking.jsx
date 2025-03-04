import React, { useState, useEffect } from "react";
import { dbOperations } from "../../lib";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../../lib/store";
import * as XLSX from 'xlsx';

export default function QualityTracking() {
  const user = useAuthStore((state) => state.user);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [qualityData, setQualityData] = useState({
    summary: { totalOk: 0, totalNok: 0 },
    reports: [],
    controls: []
  });
  const [loading, setLoading] = useState(true);
  const [productionLines, setProductionLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [productionSchedule, setProductionSchedule] = useState(null);
  
  const [newReport, setNewReport] = useState({
    lineId: "",
    date: new Date().toISOString().split("T")[0],
    shift: "morning",
    product: "",
    productCode: "",
    okCount: 0,
    nokCount: 0,
    nokReasons: [],
    defectImages: [],
    notes: "",
    inspector: ""
  });

  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    loadProductionLines();
    
    // Jeśli użytkownik jest zalogowany, ustaw inspektora
    if (user) {
      setNewReport(prev => ({
        ...prev,
        inspector: `${user.first_name} ${user.last_name}`
      }));
    }
  }, [user]);

  useEffect(() => {
    if (selectedLine) {
      loadQualityData();
    }
  }, [selectedDate, selectedLine]);

  const loadProductionLines = async () => {
    try {
      setLoading(true);
      const lines = await dbOperations.getProductionLines();
      setProductionLines(lines || []);
      
      // Jeśli są linie produkcyjne, wybierz pierwszą
      if (lines && lines.length > 0) {
        setSelectedLine(lines[0].id);
      }
    } catch (error) {
      console.error("Błąd podczas ładowania linii produkcyjnych:", error);
      toast.error("Nie udało się załadować linii produkcyjnych");
    } finally {
      setLoading(false);
    }
  };

  const loadQualityData = async () => {
    try {
      setLoading(true);
      
      // Pobierz dane jakościowe dla wybranej linii i daty
      const qualityReports = await dbOperations.getQualityDataForLine(selectedLine, selectedDate);
      
      // Pobierz dane produkcyjne dla wybranej linii
      const productionData = await dbOperations.getProductionDataForLine(selectedLine);
      
      // Ustaw harmonogram produkcji
      if (productionData && productionData.length > 0) {
        setProductionSchedule(productionData[0]);
      }
      
      // Oblicz metryki jakości
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 7); // Ostatni tydzień
      const metrics = await dbOperations.calculateQualityMetrics(
        selectedLine, 
        startDate.toISOString().split('T')[0], 
        selectedDate
      );
      
      console.log('Pobrane metryki jakości:', metrics);
      
      // Przygotuj dane do wyświetlenia
      const formattedReports = qualityReports ? qualityReports.map(report => ({
        id: report.id,
        shift: report.shift,
        product: report.product || "Nieznany produkt",
        productCode: report.product_code || "-",
        okCount: report.ok_count || 0,
        nokCount: report.nok_count || 0,
        nokReasons: report.nok_reasons || [],
        operator: report.inspector || "Nieznany",
        status: report.status || "completed"
      })) : [];
      
      // Wygeneruj plan kontroli jakości na podstawie danych produkcyjnych
      let controlPoints = [];
      if (productionData && productionData.length > 0) {
        const controlPlan = await dbOperations.generateQualityControlPlan(selectedLine, productionData[0]);
        controlPoints = controlPlan ? controlPlan.control_points.map((point, index) => ({
          id: index,
          time: `${Math.floor(index / 2) + 8}:${index % 2 === 0 ? '00' : '30'}`,
          stage: `Kontrola ${point.unit_number} szt.`,
          product: productionData[0].product_type || "Nieznany produkt",
          productCode: "P" + (Math.floor(Math.random() * 1000) + 1000),
          parameter: point.parameters[0].name,
          value: (Math.random() * 10 + 90).toFixed(1),
          unit: point.parameters[0].unit,
          result: Math.random() > 0.1 ? "pass" : "fail",
          limit: "100 ± 5 mm",
          inspector: user ? `${user.first_name} ${user.last_name}` : "Nieznany"
        })) : [];
      }
      
      // Pobierz metryki jakości
      const qualityMetrics = await dbOperations.calculateQualityMetrics(selectedLine, selectedDate, selectedDate);
      
      setQualityData({
        summary: {
          totalOk: qualityMetrics ? qualityMetrics.totalOk : 0,
          totalNok: qualityMetrics ? qualityMetrics.totalNok : 0,
          defectRate: qualityMetrics ? qualityMetrics.defectRate : 0,
          commonDefects: qualityMetrics ? qualityMetrics.commonDefects : []
        },
        reports: formattedReports,
        controls: controlPoints
      });
    } catch (error) {
      console.error("Błąd podczas ładowania danych jakościowych:", error);
      toast.error("Nie udało się załadować danych jakościowych");
    } finally {
      setLoading(false);
    }
  };

  const handleAddReport = async () => {
    try {
      if (!newReport.lineId) {
        newReport.lineId = selectedLine;
      }
      
      if (!newReport.lineId) {
        toast.error("Wybierz linię produkcyjną");
        return;
      }
      
      if (!newReport.product) {
        toast.error("Podaj nazwę produktu");
        return;
      }
      
      // Usuń puste powody NG
      const validReasons = newReport.nokReasons.filter(reason => reason.reason && reason.count > 0);
      
      const reportData = {
        ...newReport,
        nokReasons: validReasons,
        date: selectedDate
      };
      
      const loadingToast = toast.loading("Zapisywanie raportu jakości...");
      
      // Zapisz raport jakości
      const result = await dbOperations.createQualityReport(newReport.lineId, reportData);
      
      toast.dismiss(loadingToast);
      
      if (result) {
        toast.success(result.updated ? "Raport jakości został zaktualizowany" : "Raport jakości został utworzony");
        setShowAddReportModal(false);
        
        // Zresetuj formularz
        setNewReport({
          lineId: selectedLine,
          date: new Date().toISOString().split("T")[0],
          shift: "morning",
          product: "",
          productCode: "",
          okCount: 0,
          nokCount: 0,
          nokReasons: [],
          defectImages: [],
          notes: "",
          inspector: user ? `${user.first_name} ${user.last_name}` : ""
        });
        
        // Odśwież dane
        loadQualityData();
      }
    } catch (error) {
      console.error("Błąd podczas dodawania raportu jakości:", error);
      toast.error("Nie udało się zapisać raportu jakości");
    }
  };

  const handleReasonChange = (index, field, value) => {
    const updatedReasons = [...newReport.nokReasons];
    updatedReasons[index] = { ...updatedReasons[index], [field]: value };
    setNewReport({ ...newReport, nokReasons: updatedReasons });
  };

  const addReason = () => {
    setNewReport({
      ...newReport,
      nokReasons: [...newReport.nokReasons, { reason: "", count: 0 }]
    });
  };

  const removeReason = (index) => {
    const updatedReasons = [...newReport.nokReasons];
    updatedReasons.splice(index, 1);
    setNewReport({ ...newReport, nokReasons: updatedReasons });
  };

  const calculateDefectRate = (ok, nok) => {
    const total = ok + nok;
    return total > 0 ? ((nok / total) * 100).toFixed(1) : '0.0';
  };

  const handleEditReport = (report) => {
    setEditingReport(report);
    setNewReport({
      lineId: selectedLine,
      date: selectedDate,
      shift: report.shift,
      product: report.product,
      productCode: report.productCode,
      okCount: report.okCount,
      nokCount: report.nokCount,
      nokReasons: report.nokReasons || [],
      defectImages: report.defectImages || [],
      notes: report.notes || "",
      inspector: report.operator
    });
    setShowAddReportModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (!selectedLine) {
            toast.error("Wybierz linię produkcyjną");
            return;
        }

        if (!newReport.product) {
            toast.error("Podaj nazwę produktu");
            return;
        }

        // Sprawdź czy liczba kontrolowanych sztuk nie przekracza produkcji
        const totalChecked = parseInt(newReport.okCount) + parseInt(newReport.nokCount);
        if (productionSchedule && totalChecked > productionSchedule.actual_units) {
            toast.error("Liczba skontrolowanych sztuk nie może przekraczać aktualnej produkcji");
            return;
        }

        // Usuń puste powody NG
        const validReasons = newReport.nokReasons.filter(reason => reason.reason && reason.count > 0);

        // Upewnij się, że data jest w odpowiednim formacie
        const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

        const reportData = {
            ...newReport,
            lineId: selectedLine,
            date: formattedDate,
            nokReasons: validReasons
        };

        let result;
        const loadingToast = toast.loading(editingReport ? "Aktualizowanie raportu..." : "Dodawanie raportu...");

        if (editingReport) {
            // Jeśli edytujemy istniejący raport
            result = await dbOperations.updateQualityReport(editingReport.id, reportData);
        } else {
            // Jeśli tworzymy nowy raport
            result = await dbOperations.createQualityReport(reportData);
        }

        toast.dismiss(loadingToast);

        if (result) {
            toast.success(editingReport ? "Raport jakości został zaktualizowany" : "Raport jakości został dodany");
            setShowAddReportModal(false);
            setEditingReport(null);
            loadQualityData();
            
            // Resetuj formularz
            setNewReport({
                lineId: selectedLine,
                date: formattedDate,
                shift: "morning",
                product: productionSchedule?.product_type || "",
                productCode: productionSchedule?.product_code || "",
                okCount: 0,
                nokCount: 0,
                nokReasons: [],
                defectImages: [],
                notes: "",
                inspector: user ? `${user.first_name} ${user.last_name}` : ""
            });
        }
    } catch (error) {
        console.error("Błąd podczas " + (editingReport ? "aktualizacji" : "dodawania") + " raportu jakości:", error);
        toast.error("Nie udało się " + (editingReport ? "zaktualizować" : "dodać") + " raportu jakości: " + error.message);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Plik ${file.name} ma nieprawidłowy format. Dozwolone formaty: JPG, PNG`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`Plik ${file.name} jest za duży. Maksymalny rozmiar: 5MB`);
        return false;
      }
      return true;
    });

    // Konwertuj obrazy na base64
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReport(prev => ({
          ...prev,
          defectImages: [...prev.defectImages, {
            name: file.name,
            type: file.type,
            data: reader.result
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setNewReport(prev => ({
      ...prev,
      defectImages: prev.defectImages.filter((_, i) => i !== index)
    }));
  };

  const exportToExcel = () => {
    try {
      // Przygotuj dane do eksportu
      const reportsToExport = qualityData.reports.map(report => ({
        'Data': selectedDate,
        'Zmiana': report.shift === 'morning' ? 'Poranna' : 
                 report.shift === 'afternoon' ? 'Popołudniowa' : 
                 report.shift === 'night' ? 'Nocna' : report.shift,
        'Produkt': report.product,
        'Kod produktu': report.productCode,
        'Ilość OK': report.okCount,
        'Ilość NG': report.nokCount,
        'Wskaźnik wadliwości (%)': calculateDefectRate(report.okCount, report.nokCount),
        'Powody NG': report.nokReasons.map(r => `${r.reason}: ${r.count}`).join(', '),
        'Operator': report.operator,
        'Status': report.status === 'completed' ? 'Zatwierdzony' : 
                 report.status === 'in_progress' ? 'W trakcie' : report.status
      }));

      // Utwórz arkusz Excel
      const ws = XLSX.utils.json_to_sheet(reportsToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Raport Jakości');

      // Pobierz plik
      const fileName = `raport_jakosci_${selectedDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Raport został wyeksportowany do Excela');
    } catch (error) {
      console.error('Błąd podczas eksportu do Excela:', error);
      toast.error('Nie udało się wyeksportować raportu');
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      if (!window.confirm('Czy na pewno chcesz usunąć ten raport? Tej operacji nie można cofnąć.')) {
        return;
      }

      const loadingToast = toast.loading('Usuwanie raportu...');
      await dbOperations.deleteQualityReport(reportId);
      toast.dismiss(loadingToast);
      toast.success('Raport został usunięty');
      loadQualityData(); // Odśwież dane po usunięciu
    } catch (error) {
      console.error('Błąd podczas usuwania raportu:', error);
      toast.error('Nie udało się usunąć raportu: ' + error.message);
    }
  };

  if (loading && !qualityData.reports.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wybór linii produkcyjnej */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="card-title">Kontrola Jakości</h3>
            <div className="flex gap-4">
              <select 
                className="select select-bordered"
                value={selectedLine || ""}
                onChange={(e) => setSelectedLine(e.target.value)}
              >
                <option value="" disabled>Wybierz linię produkcyjną</option>
                {productionLines.map(line => (
                  <option key={line.id} value={line.id}>{line.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input input-bordered"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Podsumowanie jakości */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h3 className="card-title">Podsumowanie Jakości</h3>
            <div className="flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddReportModal(true)}
              >
                Dodaj raport
              </button>
              <button 
                className="btn btn-outline"
                onClick={exportToExcel}
                disabled={!qualityData.reports.length}
              >
                Eksportuj do Excel
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
              <div className="stat-title">Wadliwe (NG)</div>
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
              {qualityData.reports.length > 0 ? (
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Zmiana</th>
                      <th>Produkt</th>
                      <th>OK</th>
                      <th>NG</th>
                      <th>Powody NG</th>
                      <th>Operator</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityData.reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.shift === 'morning' ? 'Poranna' : 
                             report.shift === 'afternoon' ? 'Popołudniowa' : 
                             report.shift === 'night' ? 'Nocna' : report.shift}</td>
                        <td>
                          <div className="font-bold">{report.product}</div>
                          <div className="text-sm opacity-50">{report.productCode}</div>
                        </td>
                        <td>{report.okCount}</td>
                        <td>{report.nokCount}</td>
                        <td>
                          {report.nokReasons && report.nokReasons.length > 0 ? (
                            report.nokReasons.map((reason, index) => (
                              <div key={index} className="text-sm">
                                • {reason.reason}: {reason.count}
                              </div>
                            ))
                          ) : (
                            <span className="text-sm opacity-50">Brak danych</span>
                          )}
                        </td>
                        <td>{report.operator}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className={`badge ${
                              report.status === 'completed' ? 'badge-success' :
                              report.status === 'in_progress' ? 'badge-warning' :
                              'badge-ghost'
                            }`}>
                              {report.status === 'completed' ? 'Zatwierdzony' :
                               report.status === 'in_progress' ? 'W trakcie' :
                               report.status}
                            </div>
                            <button 
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleEditReport(report)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            {(user?.role === 'admin' || user?.role === 'foreman') && (
                              <button 
                                className="btn btn-ghost btn-xs text-error"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4">
                  <p>Brak raportów jakości dla wybranej linii i daty</p>
                  <button 
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => setShowAddReportModal(true)}
                  >
                    Dodaj pierwszy raport
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'controls' && (
            <div className="overflow-x-auto">
              {qualityData.controls.length > 0 ? (
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
              ) : (
                <div className="text-center py-4">
                  <p>Brak kontroli jakości dla wybranej linii i daty</p>
                  <p className="text-sm opacity-70 mt-2">
                    Kontrole jakości są generowane automatycznie na podstawie danych produkcyjnych
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal dodawania/edycji raportu */}
      {showAddReportModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingReport ? "Edytuj raport jakościowy" : "Dodaj raport jakościowy"}
            </h3>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Linia produkcyjna</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={newReport.lineId || selectedLine || ""}
                    onChange={(e) => setNewReport({...newReport, lineId: e.target.value})}
                  >
                    <option value="" disabled>Wybierz linię</option>
                    {productionLines.map(line => (
                      <option key={line.id} value={line.id}>{line.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Zmiana</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={newReport.shift}
                    onChange={(e) => setNewReport({...newReport, shift: e.target.value})}
                  >
                    <option value="morning">Poranna (6:00-14:00)</option>
                    <option value="afternoon">Popołudniowa (14:00-22:00)</option>
                    <option value="night">Nocna (22:00-6:00)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Produkt</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    value={newReport.product}
                    onChange={(e) => setNewReport({...newReport, product: e.target.value})}
                    placeholder="Nazwa produktu"
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Kod produktu</span>
                  </label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    value={newReport.productCode}
                    onChange={(e) => setNewReport({...newReport, productCode: e.target.value})}
                    placeholder="Kod produktu (opcjonalnie)"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ilość OK</span>
                  </label>
                  <input 
                    type="number" 
                    className="input input-bordered w-full"
                    value={newReport.okCount}
                    onChange={(e) => setNewReport({...newReport, okCount: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Ilość NG</span>
                  </label>
                  <input 
                    type="number" 
                    className="input input-bordered w-full"
                    value={newReport.nokCount}
                    onChange={(e) => setNewReport({...newReport, nokCount: parseInt(e.target.value) || 0})}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Powody NG</span>
                </label>
                <div className="space-y-2">
                  {newReport.nokReasons.map((reason, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select 
                        className="select select-bordered flex-1"
                        value={reason.reason}
                        onChange={(e) => handleReasonChange(index, 'reason', e.target.value)}
                      >
                        <option value="">Wybierz powód</option>
                        <option value="Wymiary poza tolerancją">Wymiary poza tolerancją</option>
                        <option value="Wada powierzchni">Wada powierzchni</option>
                        <option value="Błąd montażu">Błąd montażu</option>
                        <option value="Uszkodzenie mechaniczne">Uszkodzenie mechaniczne</option>
                        <option value="Nieprawidłowy kolor">Nieprawidłowy kolor</option>
                        <option value="Brak elementu">Brak elementu</option>
                        <option value="Inny">Inny</option>
                      </select>
                      <input 
                        type="number" 
                        className="input input-bordered w-24"
                        placeholder="Ilość" 
                        value={reason.count}
                        onChange={(e) => handleReasonChange(index, 'count', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <button 
                        type="button" 
                        className="btn btn-square btn-sm btn-error"
                        onClick={() => removeReason(index)}
                        disabled={newReport.nokReasons.length <= 1}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn btn-outline btn-sm"
                    onClick={addReason}
                  >
                    + Dodaj powód
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Uwagi</span>
                </label>
                <textarea 
                  className="textarea textarea-bordered" 
                  rows="3"
                  value={newReport.notes}
                  onChange={(e) => setNewReport({...newReport, notes: e.target.value})}
                  placeholder="Dodatkowe uwagi do raportu jakości"
                ></textarea>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Inspektor</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered w-full"
                  value={newReport.inspector}
                  onChange={(e) => setNewReport({...newReport, inspector: e.target.value})}
                  placeholder="Imię i nazwisko inspektora"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Zdjęcia wad (opcjonalnie)</span>
                </label>
                <input
                  type="file"
                  className="file-input file-input-bordered w-full"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleImageUpload}
                />
                {newReport.defectImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {newReport.defectImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.data}
                          alt={`Wada ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          className="btn btn-circle btn-xs absolute top-1 right-1 bg-red-500 text-white"
                          onClick={() => removeImage(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => {
                  setShowAddReportModal(false);
                  setEditingReport(null);
                }}
              >
                Anuluj
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingReport ? "Zapisz zmiany" : "Zapisz"}
              </button>
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