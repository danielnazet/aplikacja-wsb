import React, { useState, useEffect } from "react";

export default function AlertSystem({ alerts, onDismiss }) {
  const [notifications, setNotifications] = useState([]);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  useEffect(() => {
    setNotifications(alerts);
  }, [alerts]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / 1000 / 60);

    if (diffInMinutes < 1) return 'przed chwilą';
    if (diffInMinutes < 60) return `${diffInMinutes} min temu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h temu`;
    return `${Math.floor(diffInMinutes / 1440)}d temu`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 space-y-2">
      {/* Przycisk pokazujący wszystkie alerty */}
      <div className="flex justify-end mb-2">
        <button
          className="btn btn-circle btn-primary"
          onClick={() => setShowAllAlerts(!showAllAlerts)}
        >
          <div className="indicator">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="badge badge-sm indicator-item badge-primary">{notifications.length}</span>
            )}
          </div>
        </button>
      </div>

      {/* Panel alertów */}
      {showAllAlerts && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-4">
            <h3 className="card-title text-lg mb-4">
              Powiadomienia
              <div className="flex gap-2">
                <span className="badge badge-error">
                  {notifications.filter(n => n.priority === 'critical').length} krytyczne
                </span>
                <span className="badge badge-warning">
                  {notifications.filter(n => n.priority === 'warning').length} ostrzeżenia
                </span>
              </div>
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {notifications.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert ${getPriorityColor(alert.priority)} shadow-lg`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-2">
                      {getPriorityIcon(alert.priority)}
                      <div>
                        <h3 className="font-bold">{alert.title}</h3>
                        <div className="text-sm">{alert.message}</div>
                        <div className="text-xs opacity-70">{getTimeAgo(alert.timestamp)}</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => onDismiss(alert.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Najnowsze alerty (pokazywane zawsze) */}
      {!showAllAlerts && notifications.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={`alert ${getPriorityColor(alert.priority)} shadow-lg`}
        >
          <div className="flex justify-between items-start w-full">
            <div className="flex items-start gap-2">
              {getPriorityIcon(alert.priority)}
              <div>
                <h3 className="font-bold">{alert.title}</h3>
                <div className="text-sm">{alert.message}</div>
                <div className="text-xs opacity-70">{getTimeAgo(alert.timestamp)}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => onDismiss(alert.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 