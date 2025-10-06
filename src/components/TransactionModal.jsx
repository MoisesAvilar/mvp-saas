import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, useTheme, useMediaQuery
} from '@mui/material';
import { useNotification } from '../context/NotificationContext';

export default function TransactionModal({ open, handleClose, onSave, transactionToEdit, caixas = [], categorias = [] }) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipo, setTipo] = useState('saida');
  const { showNotification } = useNotification();
  const [categoriaId, setCategoriaId] = useState('')
  const [caixaId, setCaixaId] = useState('');

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

  const isEditing = transactionToEdit !== null;

  const filteredCategories = useMemo(() => {
    return categorias.filter(cat => cat.tipo === tipo);
  }, [tipo, categorias]);

  useEffect(() => {
    if (transactionToEdit) {
      setDescricao(transactionToEdit.descricao);
      setValor(transactionToEdit.valor);
      setTipo(transactionToEdit.tipo);
      setCaixaId(transactionToEdit.caixaId || '');
      setCategoriaId(transactionToEdit.categoriaId || '');
    } else {
      setDescricao('');
      setValor('');
      setTipo('saida');
      setCaixaId('');
      setCategoriaId('');
    }
  }, [transactionToEdit, open]);

  useEffect(() => {
    if (!isEditing) setCategoriaId('');
  }, [tipo, isEditing]);

  const handleSubmit = () => {
    if (!descricao || !valor || !caixaId || !categoriaId) {
      showNotification('Por favor, preencha todos os campos.', 'error');
      return;
    }

    const transactionData = {
      descricao,
      valor: parseFloat(valor),
      tipo,
      caixaId: parseInt(caixaId),
      categoriaId: parseInt(categoriaId),
      data: transactionToEdit ? transactionToEdit.data : new Date().toISOString(),
    };

    onSave(transactionData, transactionToEdit ? transactionToEdit.id : null);
    handleClose();

    // Limpa os campos
    setDescricao('');
    setValor('');
    setTipo('saida');
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6">
          {isEditing ? 'Editar Transação' : 'Adicionar Nova Transação'}
        </Typography>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField fullWidth label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} margin="normal" />
          <TextField fullWidth label="Valor (R$)" type="number" value={valor} onChange={(e) => setValor(e.target.value)} margin="normal" slotProps={{ input: { min: 0, step: 0.01 } }} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Caixa</InputLabel>
            <Select
              value={caixaId}
              label="Caixa"
              onChange={(e) => setCaixaId(e.target.value)}
            >
              {/* Gera as opções do dropdown a partir da lista de caixas */}
              {caixas.map((caixa) => (
                <MenuItem key={caixa.id} value={caixa.id}>
                  {caixa.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo</InputLabel>
            <Select value={tipo} label="Tipo" onChange={(e) => setTipo(e.target.value)}>
              <MenuItem value="saida">Saída</MenuItem>
              <MenuItem value="entrada">Entrada</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" disabled={!tipo}>
            <InputLabel>Categoria</InputLabel>
            <Select
              value={categoriaId}
              label="Categoria"
              onChange={(e) => setCategoriaId(e.target.value)}
            >
              {filteredCategories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 3, display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', justifyContent: 'flex-end' }}>
            <Button
              onClick={handleClose}
              sx={{ mr: isMobile ? 0 : 1, mt: isMobile ? 1 : 0 }}
              fullWidth={isMobile}
            >Cancelar</Button>
            <Button variant="contained" onClick={handleSubmit} fullWidth={isMobile}>Salvar</Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
