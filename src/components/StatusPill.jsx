// src/components/StatusPill.jsx (ATUALIZADO)

import React from 'react';
import { Chip } from '@mui/material';

export default function StatusPill({ status }) {
  let color = 'default';
  
  // O "toLowerCase()" é importante para garantir que "Em Estoque" e "em estoque" funcionem
  switch (status.toLowerCase()) {
    case 'entrada':
      color = 'success';
      break;
    case 'saida':
      color = 'error';
      break;
    // NOVOS STATUS DE ESTOQUE
    case 'em estoque':
      color = 'success';
      break;
    case 'nível baixo':
      color = 'warning';
      break;
    case 'em falta':
      color = 'error';
      break;
    default:
      color = 'default';
  }

  return <Chip label={status} color={color} size="small" sx={{ textTransform: 'capitalize' }}/>;
}