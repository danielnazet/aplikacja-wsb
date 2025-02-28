import React, { useState, useEffect, useRef } from "react";
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
  const [failureDetails, setFailureDetails] = useState({
    priority: "medium",
    category: "mechanical",
    description: "",
    reportedBy: ""
  });
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [kpiData, setKpiData] = useState({
    totalPlanned: 0,
    totalActual: 0,
    efficiency: 0,
    machineUtilization: 0
  });
  const [productionLines, setProductionLines] = useState([]);
  const [editingLine, setEditingLine] = useState(null);
  const [failureImage, setFailureImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

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

        console.log('Pobrani pracownicy:', workersData);
        setMachines(machinesData);
        setWorkers(workersData.filter(w => w.role === 'worker'));
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
    if (!user || (user.role !== 'admin' && user.role !== 'worker' && user.role !== 'foreman')) {
      toast.error('Brak uprawnień do zmiany statusu');
      return;
    }

    try {
      if (newStatus === 'failure') {
        setSelectedMachine(machineId);
        setShowFailureModal(true);
        setFailureDetails({
          priority: "medium",
          category: "mechanical",
          description: "",
          reportedBy: `${user.first_name} ${user.last_name}`
        });
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

  const handleFailureSubmit = async () => {
    if (!failureDetails.description.trim()) {
      toast.error('Podaj opis awarii');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Przygotuj dane awarii
      const failureData = {
        priority: failureDetails.priority,
        category: failureDetails.category,
        reportedBy: failureDetails.reportedBy,
        reportedAt: new Date().toISOString(),
        description: failureDetails.description,
        imageUrl: null
      };
      
      // Jeśli jest zdjęcie, prześlij je
      if (failureImage) {
        try {
          const loadingToastId = toast.loading('Przesyłanie zdjęcia...');
          const imageUrl = await dbOperations.uploadFailureImage(failureImage, selectedMachine);
          failureData.imageUrl = imageUrl;
          toast.dismiss(loadingToastId);
          toast.success('Zdjęcie zostało przesłane');
        } catch (imageError) {
          console.error('Błąd przesyłania zdjęcia:', imageError);
          toast.dismiss();
          
          // Wyświetl bardziej szczegółowy komunikat o błędzie
          if (imageError.message) {
            toast.error(`Błąd przesyłania zdjęcia: ${imageError.message}`);
          } else if (imageError.error_description) {
            toast.error(`Błąd przesyłania zdjęcia: ${imageError.error_description}`);
          } else if (imageError.statusText) {
            toast.error(`Błąd przesyłania zdjęcia: ${imageError.statusText}`);
          } else {
            toast.error('Nie udało się przesłać zdjęcia, ale zgłoszenie zostanie zapisane');
          }
        }
      }

      // Zapisz dane awarii
      const saveToastId = toast.loading('Zapisywanie zgłoszenia awarii...');
      try {
        const failureInfo = JSON.stringify(failureData);
        const updatedMachine = await dbOperations.updateMachineStatus(
          selectedMachine,
          'failure',
          failureInfo
        );
        
        setMachines(machines.map(m => m.id === selectedMachine ? updatedMachine : m));
        setShowFailureModal(false);
        setSelectedMachine(null);
        setFailureImage(null);
        setImagePreview(null);
        toast.dismiss(saveToastId);
        toast.success('Awaria została zgłoszona');
      } catch (saveError) {
        console.error('Błąd zapisywania zgłoszenia awarii:', saveError);
        toast.dismiss(saveToastId);
        
        // Wyświetl bardziej szczegółowy komunikat o błędzie
        if (saveError.message) {
          toast.error(`Błąd zgłaszania awarii: ${saveError.message}`);
        } else if (saveError.error_description) {
          toast.error(`Błąd zgłaszania awarii: ${saveError.error_description}`);
        } else {
          toast.error('Nie udało się zgłosić awarii');
        }
      }
    } catch (error) {
      console.error('Błąd zgłaszania awarii:', error);
      toast.dismiss();
      
      // Wyświetl bardziej szczegółowy komunikat o błędzie
      if (error.message) {
        toast.error(`Błąd zgłaszania awarii: ${error.message}`);
      } else if (error.error_description) {
        toast.error(`Błąd zgłaszania awarii: ${error.error_description}`);
      } else {
        toast.error('Nie udało się zgłosić awarii');
      }
    } finally {
      setUploadingImage(false);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Sprawdź typ pliku
    if (!file.type.startsWith('image/')) {
      toast.error('Proszę wybrać plik graficzny (JPG, PNG, GIF)');
      return;
    }
    
    // Sprawdź rozmiar pliku (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maksymalny rozmiar pliku to 5MB');
      return;
    }
    
    // Kompresuj zdjęcie, jeśli jest większe niż 1MB
    if (file.size > 1 * 1024 * 1024) {
      compressImage(file)
        .then(compressedFile => {
          setFailureImage(compressedFile);
          createImagePreview(compressedFile);
          toast.success(`Zdjęcie zostało skompresowane z ${formatFileSize(file.size)} do ${formatFileSize(compressedFile.size)}`);
        })
        .catch(error => {
          console.error('Błąd kompresji zdjęcia:', error);
          // Jeśli kompresja się nie powiedzie, użyj oryginalnego pliku
          setFailureImage(file);
          createImagePreview(file);
        });
    } else {
      // Dla małych plików nie kompresuj
      setFailureImage(file);
      createImagePreview(file);
    }
  };
  
  // Funkcja do kompresji zdjęcia
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Utwórz canvas do kompresji
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Zmniejsz wymiary, jeśli są zbyt duże
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Konwertuj canvas do Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Błąd kompresji zdjęcia'));
                return;
              }
              
              // Utwórz nowy plik z skompresowanym Blob
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg', // Zawsze konwertuj do JPEG dla lepszej kompresji
                lastModified: Date.now()
              });
              
              resolve(compressedFile);
            },
            'image/jpeg', // Zawsze konwertuj do JPEG dla lepszej kompresji
            0.6 // Jakość kompresji (0.6 = 60%) - zmniejszona dla lepszej kompresji
          );
        };
        
        img.onerror = () => {
          reject(new Error('Błąd ładowania zdjęcia do kompresji'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Błąd odczytu pliku do kompresji'));
      };
    });
  };
  
  // Funkcja do tworzenia podglądu zdjęcia
  const createImagePreview = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Funkcja do formatowania rozmiaru pliku
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const removeImage = () => {
    setFailureImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const FailureReportModal = () => {
    if (!showFailureModal) return null;
    
    const machine = machines.find(m => m.id === selectedMachine);
    
    // Oddzielny komponent dla pola tekstowego, aby uniknąć problemów z propagacją zdarzeń
    const TextareaWithoutPropagation = ({ value, onChange, placeholder }) => {
      const handleChange = (e) => {
        e.stopPropagation();
        onChange(e.target.value);
      };
      
      return (
        <textarea 
          className="textarea textarea-bordered h-24 w-full"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onKeyUp={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        />
      );
    };
    
    return (
      // Użyj funkcji onMouseDown zamiast onClick, aby zatrzymać propagację wcześniej
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div 
          className="bg-base-100 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-4">Zgłoś awarię maszyny: {machine?.name}</h3>
          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">Kategoria awarii</span>
            </label>
            <select 
              className="select select-bordered w-full"
              value={failureDetails.category}
              onChange={(e) => setFailureDetails({...failureDetails, category: e.target.value})}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="mechanical">Mechaniczna</option>
              <option value="electrical">Elektryczna</option>
              <option value="hydraulic">Hydrauliczna</option>
              <option value="software">Oprogramowanie</option>
              <option value="other">Inna</option>
            </select>
          </div>
          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">Priorytet</span>
            </label>
            <select 
              className="select select-bordered w-full"
              value={failureDetails.priority}
              onChange={(e) => setFailureDetails({...failureDetails, priority: e.target.value})}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
              <option value="critical">Krytyczny</option>
            </select>
          </div>
          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">Opis awarii</span>
            </label>
            <TextareaWithoutPropagation 
              value={failureDetails.description}
              onChange={(value) => setFailureDetails({...failureDetails, description: value})}
              placeholder="Opisz szczegóły awarii..."
            />
          </div>
          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">Zgłaszający</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered"
              value={failureDetails.reportedBy}
              onChange={(e) => setFailureDetails({...failureDetails, reportedBy: e.target.value})}
              onClick={(e) => e.stopPropagation()}
              placeholder="Imię i nazwisko zgłaszającego"
            />
          </div>
          
          <div className="form-control mb-3">
            <label className="label">
              <span className="label-text">Zdjęcie awarii (opcjonalne)</span>
            </label>
            <input 
              type="file" 
              className="file-input file-input-bordered w-full" 
              accept="image/*"
              onChange={handleImageChange}
              onClick={(e) => e.stopPropagation()}
              ref={fileInputRef}
            />
            
            {imagePreview && (
              <div className="mt-2 relative">
                <img 
                  src={imagePreview} 
                  alt="Podgląd zdjęcia" 
                  className="w-full h-auto max-h-40 object-contain rounded-md border border-base-300" 
                />
                <button 
                  className="btn btn-circle btn-xs absolute top-1 right-1 bg-base-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <button 
              className="btn btn-outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowFailureModal(false);
                setSelectedMachine(null);
                setFailureImage(null);
                setImagePreview(null);
              }}
            >
              Anuluj
            </button>
            <button 
              className="btn btn-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleFailureSubmit();
              }}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Zgłaszanie...
                </>
              ) : (
                'Zgłoś awarię'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const displayFailureDetails = (failureReason, machineId) => {
    try {
      // Sprawdzamy, czy failureReason jest w formacie JSON
      const failureData = JSON.parse(failureReason);
      
      // Sprawdź, czy imageUrl jest URL-em czy danymi Base64
      const isBase64Image = failureData.imageUrl && 
        (failureData.imageUrl.startsWith('data:image/') || 
         failureData.imageUrl.startsWith('data:application/octet-stream;base64,'));
      
      return (
        <div className="mt-2 text-error">
          <div className="font-semibold">Szczegóły awarii:</div>
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Lewa kolumna z informacjami */}
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <span className="font-semibold">Priorytet:</span>
                <span className={`badge ${getPriorityColor(failureData.priority)}`}>
                  {getPriorityText(failureData.priority)}
                </span>
              </div>
              <div><span className="font-semibold">Kategoria:</span> {getCategoryText(failureData.category)}</div>
              <div><span className="font-semibold">Opis:</span> {failureData.description}</div>
              <div><span className="font-semibold">Zgłoszone przez:</span> {failureData.reportedBy}</div>
              <div><span className="font-semibold">Data zgłoszenia:</span> {new Date(failureData.reportedAt).toLocaleString()}</div>
            </div>
            
            {/* Prawa kolumna ze zdjęciem */}
            {failureData.imageUrl && (
              <div className="w-full md:w-1/3">
                <div className="relative">
                  <img 
                    src={failureData.imageUrl} 
                    alt="Zdjęcie awarii" 
                    className="w-full h-auto max-h-40 object-contain rounded-md border border-base-300 cursor-pointer" 
                    onClick={() => window.open(failureData.imageUrl, '_blank')}
                    onError={(e) => {
                      console.error('Błąd ładowania zdjęcia:', e);
                      e.target.src = 'https://placehold.co/400x300?text=Błąd+ładowania+zdjęcia';
                      e.target.className = 'w-full h-auto max-h-40 object-contain rounded-md border border-base-300 opacity-50';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {(user?.role === 'admin' || user?.role === 'worker' || user?.role === 'foreman') && (
            <div className="flex justify-end mt-2">
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => handleClearFailureReason(machineId)}
                title="Usuń notatkę o awarii"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      );
    } catch (e) {
      // Jeśli nie jest to JSON, wyświetlamy stary format
      return (
        <div className="mt-2 text-error">
          <div className="flex justify-between items-center">
            <span>Problem: {failureReason}</span>
            {(user?.role === 'admin' || user?.role === 'worker' || user?.role === 'foreman') && (
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => handleClearFailureReason(machineId)}
                title="Usuń notatkę o awarii"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "low": return "badge-success";
      case "medium": return "badge-warning";
      case "high": return "badge-error";
      case "critical": return "badge-error";
      default: return "badge-info";
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case "low": return "Niski";
      case "medium": return "Średni";
      case "high": return "Wysoki";
      case "critical": return "Krytyczny";
      default: return "Nieznany";
    }
  };

  const getCategoryText = (category) => {
    switch (category) {
      case "mechanical": return "Mechaniczna";
      case "electrical": return "Elektryczna";
      case "hydraulic": return "Hydrauliczna";
      case "software": return "Oprogramowanie";
      case "other": return "Inna";
      default: return "Nieznana";
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
                    {(user?.role === 'admin' || user?.role === 'foreman') ? (
                      editingOperator === machine.id ? (
                        <select
                          className="select select-bordered select-sm"
                          value={machine.operator_id || ''}
                          onChange={(e) => handleOperatorChange(machine.id, e.target.value)}
                        >
                          <option value="">Brak operatora</option>
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
                              'Brak operatora'
                            }
                          </span>
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setEditingOperator(machine.id)}
                          >
                            ✏️
                          </button>
                        </div>
                      )
                    ) : (
                      <span>
                        {machine.operator ? 
                          `${machine.operator.first_name} ${machine.operator.last_name}` : 
                          'Brak operatora'
                        }
                      </span>
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
                    displayFailureDetails(machine.failure_reason, machine.id)
                  )}
                </div>
                {(user?.role === 'admin' || user?.role === 'worker' || user?.role === 'foreman') && (
                  <div className="card-actions justify-end mt-2">
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <FailureReportModal />
    </div>
  );
} 