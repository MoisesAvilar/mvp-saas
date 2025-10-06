// src/main.jsx (ATUALIZADO)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// 1. Imports do Tema
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // Nosso tema customizado

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. Aplicando o Tema */}
    <ThemeProvider theme={theme}>
      {/* CssBaseline normaliza os estilos e aplica a cor de fundo do tema */}
      <CssBaseline /> 
      <BrowserRouter>
        <NotificationProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)