// src/components/ChangeModal.jsx

import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, TextField, Button, Divider } from '@mui/material';

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function ChangeModal({ open, onClose, total, onConfirm }) {
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);

  // Limpa o campo sempre que o modal abrir
  useEffect(() => {
    if (open) {
      setAmountReceived('');
      setChange(0);
    }
  }, [open]);

  // Calcula o troco em tempo real
  useEffect(() => {
    const received = parseFloat(amountReceived);
    if (!isNaN(received) && received >= total) {
      setChange(received - total);
    } else {
      setChange(0);
    }
  }, [amountReceived, total]);

  const handleConfirm = () => {
    onConfirm(); // Chama a função que realmente finaliza a venda
    onClose();   // Fecha o modal
  };

  const receivedValue = parseFloat(amountReceived) || 0;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" gutterBottom>
          Calcular Troco
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
          <Typography variant="body1">Total da Venda:</Typography>
          <Typography variant="body1" fontWeight="bold">{formatCurrency(total)}</Typography>
        </Box>
        <TextField
          fullWidth
          autoFocus // Foca no campo assim que o modal abre
          label="Valor Recebido (R$)"
          type="number"
          value={amountReceived}
          onChange={(e) => setAmountReceived(e.target.value)}
          margin="normal"
        />
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 2 }}>
          <Typography variant="h6">Troco:</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatCurrency(change)}
          </Typography>
        </Box>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            // Desabilita o botão se o valor recebido for menor que o total
            disabled={receivedValue < total}
          >
            Confirmar Venda
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}