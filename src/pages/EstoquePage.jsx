// src/pages/EstoquePage.jsx (VERSÃO FINAL COMPLETA E POLIDA)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, TextField, useTheme,
  useMediaQuery, Card, CardContent, Grid
} from '@mui/material';
import { Tooltip } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ProductModal from '../components/ProductModal';
import AdjustStockModal from '../components/AdjustStockModal';
import { useNotification } from '../context/NotificationContext';
import StatusPill from '../components/StatusPill';
import { titleCase } from '../utils/titlecase.js';
import { API_BASE_URL } from '../config'; 

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([]);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchProdutos = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/produtos`);
        setProdutos(response.data);
      } catch (error) {
        console.error("Houve um erro ao buscar os produtos:", error);
        showNotification('Falha ao carregar os produtos.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProdutos();
  }, [showNotification]);

  const getProductStatus = (quantity) => {
    if (quantity === 0) return 'Em Falta';
    if (quantity <= 20) return 'Nível Baixo';
    return 'Em Estoque';
  };

  const filteredProdutos = useMemo(() => {
    if (!searchTerm) {
      return produtos;
    }
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [produtos, searchTerm]);

  // --- Funções de Manipulação de Dados (Handlers) ---
  const handleAddProduct = async (novoProduto) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/produtos`, novoProduto);
      setProdutos(prev => [response.data, ...prev]);
      showNotification('Produto adicionado com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao adicionar produto.', 'error');
    }
  };

  const handleAdjustStock = async (amount) => {
    if (!selectedProduct) return;
    const newQuantity = selectedProduct.quantidade + amount;
    try {
      const response = await axios.patch(`${API_BASE_URL}/produtos/{selectedProduct.id}`, { quantidade: newQuantity });
      setProdutos(prev => prev.map(p => p.id === selectedProduct.id ? response.data : p));
      showNotification('Estoque atualizado com sucesso!', 'success');
    } catch (error) {
      showNotification('Erro ao ajustar o estoque.', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto do estoque?")) {
      try {
        await axios.delete(`${API_BASE_URL}/produtos/${id}`);
        setProdutos(prev => prev.filter(p => p.id !== id));
        showNotification('Produto excluído com sucesso!', 'success');
      } catch (error) {
        showNotification('Erro ao excluir o produto.', 'error');
      }
    }
  };

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustModalOpen(true);
  };
  const handleCloseAdjustModal = () => {
    setAdjustModalOpen(false);
    setSelectedProduct(null);
  };
  const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // --- Lógica de Renderização ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (produtos.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 4 }}>
          <Typography variant="h6">Nenhum produto cadastrado no estoque.</Typography>
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setAddProductModalOpen(true)} sx={{ mt: 2 }}>
            Adicionar Primeiro Produto
          </Button>
        </Paper>
      );
    }

    // --- VISTA MOBILE (CARDS) ---
    if (isMobile) {
      return (
        <Box>
          {filteredProdutos.map((p) => (
            <Card key={p.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>{titleCase(p.nome)}</Typography>
                    <StatusPill status={getProductStatus(p.quantidade)} />
                  </Box>
                  <Box>
                    <Tooltip title="Ajustar Estoque">
                      <IconButton color="primary" onClick={() => handleOpenAdjustModal(p)}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir Produto">
                      <IconButton color="error" onClick={() => handleDeleteProduct(p.id)}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Grid container spacing={2} sx={{ textAlign: 'center' }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Qtd.</Typography>
                    <Typography variant="h6">{p.quantidade}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Custo</Typography>
                    <Typography variant="h6">{formatCurrency(p.custoUnitario)}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">Venda</Typography>
                    <Typography variant="h6">{formatCurrency(p.precoVenda)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    // --- VISTA DESKTOP (TABELA) ---
    return (
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Produto</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="center">Quantidade</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="right">Preço de Custo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="right">Preço de Venda</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProdutos.map((p) => (
              <TableRow hover key={p.id}>
                <TableCell>{titleCase(p.nome)}</TableCell>
                <TableCell align="center"><StatusPill status={getProductStatus(p.quantidade)} /></TableCell>
                <TableCell align="center">{p.quantidade}</TableCell>
                <TableCell align="right">{formatCurrency(p.custoUnitario)}</TableCell>
                <TableCell align="right">{formatCurrency(p.precoVenda)}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Ajustar Estoque">
                    <IconButton color="primary" onClick={() => handleOpenAdjustModal(p)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir Produto">
                    <IconButton color="error" onClick={() => handleDeleteProduct(p.id)}><DeleteIcon /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredProdutos.length === 0 && (
          <Typography sx={{ textAlign: 'center', p: 4 }}>
            Nenhum produto encontrado com o nome "{searchTerm}".
          </Typography>
        )}
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
          Controle de Estoque
        </Typography>
        {!isLoading && produtos.length > 0 && (
          isMobile ? (
            <Tooltip title="Adicionar Novo Produto">
              <IconButton color="primary" variant="contained" onClick={() => setAddProductModalOpen(true)} sx={{ backgroundColor: 'primary.main', color: 'white', '&:hover': { backgroundColor: 'primary.dark' } }}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setAddProductModalOpen(true)}>
              Adicionar Novo Produto
            </Button>
          )
        )}
      </Box>

      {!isLoading && produtos.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Buscar por Produto"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Paper>
      )}

      {/* Modais */}
      <ProductModal open={addProductModalOpen} handleClose={() => setAddProductModalOpen(false)} handleAddProduct={handleAddProduct} />
      <AdjustStockModal open={adjustModalOpen} handleClose={handleCloseAdjustModal} product={selectedProduct} handleAdjust={handleAdjustStock} />

      {renderContent()}
    </Box>
  );
}