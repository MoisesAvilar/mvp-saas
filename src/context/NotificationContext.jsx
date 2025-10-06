// src/contexts/NotificationContext.jsx

import React, { createContext, useState, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';

// 1. Cria o Contexto
const NotificationContext = createContext();

// 2. Cria o Provedor do Contexto
export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success', // pode ser 'error', 'warning', 'info', 'success'
  });

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // O valor que será compartilhado com todos os componentes
  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000} // A notificação some após 4 segundos
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleClose} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

// 3. Cria um "Hook" customizado para facilitar o uso do contexto
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
  }
  return context;
}