// src/components/AdjustStockModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNotification } from '../context/NotificationContext';

export default function AdjustStockModal({ open, handleClose, handleAdjust, product }) {
  const [amount, setAmount] = useState('');
  const { showNotification } = useNotification();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: isMobile ? 2 : 4,
    borderRadius: 2,
  };

  // Limpa o campo quando o modal é fechado ou o produto muda
  useEffect(() => {
    if (!open) {
      setAmount('');
    }
  }, [open]);

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount === 0) {
      showNotification('Por favor, insira um valor diferente de zero para o ajuste.', 'warning');
      return;
    }

    handleAdjust(numericAmount);
    handleClose();
  };

  if (!product) return null; // Não renderiza nada se nenhum produto foi selecionado

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6">Ajustar Estoque de: {product.nome}</Typography>
        <Typography variant="body2">Quantidade atual: {product.quantidade}</Typography>
        <TextField
          fullWidth
          label="Adicionar/Remover Quantidade"
          helperText="Use valores negativos para remover (ex: -10)"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          margin="normal"
        />
        <Box sx={{ mt: 2, display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end' }}>
          <Button
            onClick={handleClose}
            sx={{ mr: isMobile ? 0 : 1, mt: isMobile ? 1 : 0 }}
            fullWidth={isMobile}
          >
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} fullWidth={isMobile}>
            Confirmar Ajuste
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}