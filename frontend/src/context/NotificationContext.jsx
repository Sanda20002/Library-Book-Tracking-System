import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import '../styles/Notification.css';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const duration = options.duration ?? 4000;
    setNotification({
      id: Date.now(),
      message,
      type,
      duration,
    });
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, notification.duration);

    return () => clearTimeout(timer);
  }, [notification]);

  const getTitleAndIcon = () => {
    if (!notification) return { title: '', icon: '' };
    switch (notification.type) {
      case 'success':
        return { title: 'Success', icon: '✅' };
      case 'error':
        return { title: 'Error', icon: '❌' };
      case 'warning':
        return { title: 'Warning', icon: '⚠️' };
      default:
        return { title: 'Info', icon: 'ℹ️' };
    }
  };

  const { title, icon } = getTitleAndIcon();

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      {notification && (
        <div className="notification-container">
          <div className={`notification notification-${notification.type}`}>
            <div className="notification-icon">{icon}</div>
            <div className="notification-content">
              <div className="notification-title">{title}</div>
              <p className="notification-message">{notification.message}</p>
            </div>
            <button
              type="button"
              className="notification-close"
              onClick={clearNotification}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return ctx;
};
