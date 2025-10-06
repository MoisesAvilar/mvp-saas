// src/App.jsx (ATUALIZADO para gerenciar o Tema)
import React, { useState, useMemo, createContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import POSPage from './pages/POSPage';
import DashboardPage from './pages/DashboardPage';
import CaixaPage from './pages/CaixaPage';
import EstoquePage from './pages/EstoquePage';
import LoginPage from './pages/LoginPage';
import ReportsPage from './pages/ReportsPage';

// 1. Criamos um Contexto para passar a função de troca de tema
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
  // 2. Estado para controlar o modo atual ('light' ou 'dark')
  const [mode, setMode] = useState('light');

  // 3. Objeto com a função que será compartilhada via contexto
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
    }),
    [],
  );

  // 4. Cria o tema do MUI dinamicamente baseado no estado 'mode'
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode, // Aqui a mágica acontece: 'light' ou 'dark'
          ...(mode === 'light'
            ? { // Paleta para o modo claro (pode customizar mais)
                primary: { main: '#5E35B1' },
                background: { default: '#f4f6f8', paper: '#ffffff' },
              }
            : { // Paleta para o modo escuro
                primary: { main: '#7E57C2' }, // Um roxo um pouco mais claro para contraste
                background: { default: '#121212', paper: '#1E1E1E' },
              }),
        },
        // ... outras customizações de tema (typography, shape) podem vir aqui
      }),
    [mode],
  );

  return (
    // 5. Passamos a função de troca para todos os componentes
    <ColorModeContext.Provider value={colorMode}>
      {/* 6. Usamos o tema dinâmico no ThemeProvider */}
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<POSPage />} /> 
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/caixa" element={<CaixaPage />} />
                  <Route path="/estoque" element={<EstoquePage />} />
                  <Route path="/relatorios" element={<ReportsPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;