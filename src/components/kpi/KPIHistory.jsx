import React, { useState, useEffect } from 'react';
import { dbOperations } from '../../lib/db/db';
import { toast } from 'react-hot-toast';

export default function KPIHistory({ startDate, endDate }) {
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
} 