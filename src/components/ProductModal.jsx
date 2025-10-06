import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, useTheme, useMediaQuery } from '@mui/material';
import { useNotification } from '../context/NotificationContext';

export default function ProductModal({ open, handleClose, handleAddProduct }) {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
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

  const handleSubmit = () => {
    const q = parseFloat(quantidade);
    const custo = parseFloat(custoUnitario);
    const preco = parseFloat(precoVenda);

    if (!nome.trim()) {
      showNotification('O nome do produto é obrigatório.', 'error');
      return;
    }
    if (isNaN(q) || q < 0) {
      showNotification('Quantidade deve ser maior ou igual a 0.', 'error');
      return;
    }
    if (isNaN(custo) || custo < 0) {
      showNotification('Preço de custo deve ser maior ou igual a 0.', 'error');
      return;
    }
    if (isNaN(preco) || preco < 0) {
      showNotification('Preço de venda deve ser maior ou igual a 0.', 'error');
      return;
    }

    const novoProduto = {
      nome: nome.trim(),
      quantidade: q,
      custoUnitario: custo,
      precoVenda: preco,
    };

    handleAddProduct(novoProduto);
    handleClose();

    setNome('');
    setQuantidade('');
    setCustoUnitario('');
    setPrecoVenda('');
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6">Adicionar Novo Produto</Typography>
        <TextField
          fullWidth
          label="Nome do Produto"
          value={nome}
          onChange={e => setNome(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Quantidade Inicial"
          type="number"
          value={quantidade}
          onChange={e => setQuantidade(e.target.value)}
          margin="normal"
          slotProps={{ input: { min: 0, step: 1 } }}
        />
        <TextField
          fullWidth
          label="Preço de Custo (R$)"
          type="number"
          value={custoUnitario}
          onChange={e => setCustoUnitario(e.target.value)}
          margin="normal"
          slotProps={{ input: { min: 0, step: 0.01 } }}
        />
        <TextField
          fullWidth
          label="Preço de Venda (R$)"
          type="number"
          value={precoVenda}
          onChange={e => setPrecoVenda(e.target.value)}
          margin="normal"
          slotProps={{ input: { min: 0, step: 0.01 } }}
        />
        <Box sx={{ mt: 2, display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end' }}>
          <Button
            onClick={handleClose}
            sx={{ mr: isMobile ? 0 : 1, mt: isMobile ? 1 : 0 }}
            fullWidth={isMobile}
          >
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSubmit} fullWidth={isMobile}>Salvar</Button>
        </Box>
      </Box>
    </Modal>
  );
}
