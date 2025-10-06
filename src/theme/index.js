// src/theme/index.js

import { createTheme } from '@mui/material/styles';

// Crie o nosso tema customizado
const theme = createTheme({
  palette: {
    mode: 'light', // Podemos mudar para 'dark' para um tema escuro
    primary: {
      main: '#5E35B1', // Um roxo moderno, sai do azul padrão
    },
    secondary: {
      main: '#f44336', // Vermelho para ações secundárias ou alertas
    },
    background: {
      default: '#f4f6f8', // Um cinza bem claro para o fundo, mais suave que o branco puro
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700, // Títulos mais fortes
    },
  },
  shape: {
    borderRadius: 8, // Bordas um pouco mais arredondadas
  },
  components: {
    // Sobrescrevendo o estilo padrão de alguns componentes
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Botões sem TUDO MAIÚSCULO
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          // Uma sombra mais sutil para os cards e tabelas
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export default theme;