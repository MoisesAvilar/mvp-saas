import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, CircularProgress, TextField, FormControl, InputLabel, Select, MenuItem, Grid,
  useTheme, useMediaQuery, Card, CardContent, Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { CSVLink } from 'react-csv';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import TransactionModal from '../components/TransactionModal';
import { useNotification } from '../context/NotificationContext.jsx';
import StatusPill from '../components/StatusPill';
import StatCard from '../components/StatCard';
import { titleCase } from '../utils/titlecase.js';
import { API_BASE_URL } from '../config';


export default function CaixaPage() {
  const [transacoes, setTransacoes] = useState([]);
  const [caixas, setCaixas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [caixaFilter, setCaixaFilter] = useState('todos');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [periodFilter, setPeriodFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [transacoesRes, caixasRes, categoriasRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/transacoes`),
          axios.get(`${API_BASE_URL}/caixas`),
          axios.get(`${API_BASE_URL}/categorias`),
        ]);
        setTransacoes(transacoesRes.data.sort((a, b) => new Date(b.data) - new Date(a.data)));
        setCaixas(caixasRes.data);
        setCategorias(categoriasRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        showNotification('Falha ao carregar dados da página.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  }

  const handleSaveTransaction = async (transactionData, id) => {
    // Lógica de Criar (POST) ou Atualizar (PUT)
    const isEditing = id !== null;
    const url = isEditing ? `${API_BASE_URL}/transacoes/${id}` : `${API_BASE_URL}/transacoes`;
    const method = isEditing ? 'put' : 'post';

    try {
      const response = await axios[method](url, transactionData);
      if (isEditing) {
        setTransacoes(prev => prev.map(t => (t.id === id ? response.data : t)));
      } else {
        setTransacoes(prev => [response.data, ...prev]);
      }
      showNotification(`Transação ${isEditing ? 'atualizada' : 'adicionada'} com sucesso!`, 'success');
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      showNotification('Erro ao salvar transação.', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Você tem certeza que deseja excluir esta transação?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/transacoes/${id}`);
      setTransacoes(prev => prev.filter(t => t.id !== id));
      showNotification('Transação excluída com sucesso!', 'success');
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      showNotification('Erro ao excluir transação.', 'error');
    }
  };

  const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const filteredTransacoes = useMemo(() => {
    // Inicia a lógica do filtro de período
    let periodMatch;
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    return transacoes.filter(t => {
      const searchMatch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === 'todos' || t.tipo === typeFilter;
      const caixaMatch = caixaFilter === 'todos' || t.caixaId === parseInt(caixaFilter);
      const categoriaMatch = categoriaFilter === 'todos' || t.categoriaId === parseInt(categoriaFilter);

      // Lógica de período refatorada
      if (periodFilter === 'todos') {
        periodMatch = true;
      } else {
        const transactionDate = new Date(t.data);
        transactionDate.setUTCHours(0, 0, 0, 0);
        
        switch (periodFilter) {
          case 'hoje':
            periodMatch = transactionDate.getTime() === now.getTime();
            break;
          case 'semana':
            const firstDayOfWeek = new Date(now);
            firstDayOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setUTCDate(firstDayOfWeek.getUTCDate() + 6);
            periodMatch = transactionDate >= firstDayOfWeek && transactionDate <= lastDayOfWeek;
            break;
          case 'mes':
            periodMatch = transactionDate.getUTCFullYear() === now.getUTCFullYear() && transactionDate.getUTCMonth() === now.getUTCMonth();
            break;
          case 'personalizado':
            if (startDate && endDate) {
              const start = new Date(startDate + 'T00:00:00Z');
              const end = new Date(endDate + 'T23:59:59Z');
              periodMatch = transactionDate >= start && transactionDate <= end;
            } else {
              periodMatch = true; // não filtra se as datas não estiverem setadas
            }
            break;
          default:
            periodMatch = true;
            break;
        }
      }
      
      // Retorno único que aplica TODAS as condições
      return searchMatch && typeMatch && caixaMatch && categoriaMatch && periodMatch;
    });
  }, [transacoes, searchTerm, typeFilter, caixaFilter, categoriaFilter, periodFilter, startDate, endDate]);

  const summary = useMemo(() => {
    const totalEntradas = filteredTransacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((acc, t) => acc + t.valor, 0);

    const totalSaidas = filteredTransacoes
      .filter(t => t.tipo === 'saida')
      .reduce((acc, t) => acc + t.valor, 0);

    const saldo = totalEntradas - totalSaidas;

    return { totalEntradas, totalSaidas, saldo };
  }, [filteredTransacoes]);

  const headers = [
    { label: "ID", key: "id" },
    { label: "Descrição", key: "descricao" },
    { label: "Valor", key: "valor" },
    { label: "Tipo", key: "tipo" },
    { label: "Data", key: "data" },
    { label: "Caixa", key: "caixaId" } // Vamos exportar o ID, mas podemos melhorar isso depois
  ];

  // 3. Crie o objeto de dados para o relatório CSV
  const csvReport = {
    data: filteredTransacoes,
    headers: headers,
    filename: `Relatorio_FluxoDeCaixa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`
  };

  const caixaNome = (id) => {
    const caixa = caixas.find(c => String(c.id) === String(id));
    return caixa ? caixa.nome : 'N/A';
  };

  const categoriaNome = (id) => {
    const categoria = categorias.find(c => String(c.id) === String(id));
    return categoria ? categoria.nome : 'N/A';
  };

  const renderContent = () => {
    if (isLoading) { return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>; }
    if (transacoes.length === 0) { return <Paper sx={{ textAlign: 'center', p: 4, mt: 4 }}><Typography variant="h6">Nenhuma transação encontrada.</Typography><Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleOpenAddModal} sx={{ mt: 2 }}>Adicionar Transação</Button></Paper>; }

    // --- VISTA MOBILE (CARDS) ---
    if (isMobile) {
      return (
        <Box>
          {filteredTransacoes.map((t) => (
            <Card key={t.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{titleCase(t.descricao)}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(t.data).toLocaleDateString('pt-BR')} - {caixaNome(t.caixaId)}</Typography>
                  </Box>
                  <Box>
                    <Tooltip title="Editar"><IconButton size="small" color="primary" onClick={() => handleOpenEditModal(t)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDeleteTransaction(t.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <StatusPill status={t.tipo} />
                  <Typography variant="h6" color={t.tipo === 'entrada' ? 'success.main' : 'error.main'}>{formatCurrency(t.valor)}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    // --- VISTA DESKTOP (TABELA) ---
    return (
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Descrição</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Categoria</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Caixa</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="right">Valor</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="center">Tipo</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="center">Data</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textTransform: 'uppercase' }} align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransacoes.map((t) => {
              return (
                <TableRow hover key={t.id}>
                  <TableCell>{titleCase(t.descricao)}</TableCell>
                  <TableCell>{categoriaNome(t.categoriaId)}</TableCell>
                  <TableCell>{caixaNome(t.caixaId)}</TableCell>
                  <TableCell align="right">{formatCurrency(t.valor)}</TableCell>
                  <TableCell align="center"><StatusPill status={t.tipo} /></TableCell>
                  <TableCell align="center">{new Date(t.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton color="primary" onClick={() => handleOpenEditModal(t)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" onClick={() => handleDeleteTransaction(t.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filteredTransacoes.length === 0 && (
          <Typography sx={{ textAlign: 'center', p: 4 }}>
            Nenhum resultado encontrado para os filtros aplicados.
          </Typography>
        )}
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 2,
        }}
      >
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
          Fluxo de Caixa
        </Typography>

        {!isLoading && transacoes.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isMobile ? (
              <>
                <Tooltip title="Nova Transação">
                  <IconButton
                    color="primary"
                    onClick={handleOpenAddModal}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Exportar CSV">
                  <IconButton
                    color="primary"
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }}
                  >
                    <CSVLink
                      {...csvReport}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <FileDownloadIcon />
                    </CSVLink>
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleOpenAddModal}
                >
                  Adicionar Transação
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadIcon />}
                >
                  <CSVLink
                    {...csvReport}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    Exportar CSV
                  </CSVLink>
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>


      {/* Resumo Financeiro */}
      <Grid container columnSpacing={2} rowSpacing={2} mb={3}>
      {[
        { 
          title: "Total Entradas", 
          value: summary.totalEntradas, 
          icon: <ArrowUpwardIcon sx={{ fontSize: 40, color: 'green' }} /> 
        },
        { 
          title: "Total Saídas", 
          value: summary.totalSaidas, 
          icon: <ArrowDownwardIcon sx={{ fontSize: 40, color: 'red' }} /> 
        },
        { 
          title: "Saldo", 
          value: summary.saldo, 
          icon: <AccountBalanceWalletIcon sx={{ fontSize: 40, color: summary.saldo >= 0 ? 'blue' : 'red' }} /> 
        }
      ].map((stat, index) => (
        <Box key={index} sx={{ flex: '1 1 0', mx: 0 }}>
          <StatCard 
            title={stat.title} 
            value={formatCurrency(stat.value)} 
            icon={stat.icon} 
          />
        </Box>
      ))}
    </Grid>

    {/* Interface dos Filtros */}
    {!isLoading && transacoes.length > 0 && (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filtros</Typography>

        {/* Se for mobile, busca em uma linha e filtros em outra */}
        {isMobile ? (
          <>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Buscar por Descrição"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Filtrar por Tipo"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    <MenuItem value="entrada">Entrada</MenuItem>
                    <MenuItem value="saida">Saída</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Caixa</InputLabel>
                  <Select
                    value={caixaFilter}
                    label="Caixa"
                    onChange={(e) => setCaixaFilter(e.target.value)}
                  >
                    <MenuItem value="todos">Todos</MenuItem>
                    {caixas.map(caixa => (
                      <MenuItem key={caixa.id} value={caixa.id}>{caixa.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={periodFilter}
                    label="Filtrar por Período"
                    onChange={(e) => setPeriodFilter(e.target.value)}
                  >
                    <MenuItem value="todos">Sempre</MenuItem>
                    <MenuItem value="hoje">Hoje</MenuItem>
                    <MenuItem value="semana">Esta Semana</MenuItem>
                    <MenuItem value="mes">Este Mês</MenuItem>
                    <MenuItem value="personalizado">Personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select value={categoriaFilter} label="Categoria" onChange={(e) => setCategoriaFilter(e.target.value)}>
                  <MenuItem value="todos">Todas</MenuItem>
                  {categorias.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            </Grid>

            {periodFilter === 'personalizado' && (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Início"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Fim"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </Grid>
              </Grid>
            )}
          </>
        ) : (
          /* Layout original para desktop */
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar por Descrição"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={typeFilter}
                  label="Filtrar por Tipo"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="entrada">Entrada</MenuItem>
                  <MenuItem value="saida">Saída</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth>
                <InputLabel>Caixa</InputLabel>
                <Select
                  value={caixaFilter}
                  label="Caixa"
                  onChange={(e) => setCaixaFilter(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  {caixas.map(caixa => (
                    <MenuItem key={caixa.id} value={caixa.id}>{caixa.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={categoriaFilter}
                  label="Categoria"
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                >
                  <MenuItem value="todos">Todas</MenuItem>
                  {categorias.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>{cat.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Período</InputLabel>
                <Select
                  value={periodFilter}
                  label="Filtrar por Período"
                  onChange={(e) => setPeriodFilter(e.target.value)}
                >
                  <MenuItem value="todos">Sempre</MenuItem>
                  <MenuItem value="hoje">Hoje</MenuItem>
                  <MenuItem value="semana">Esta Semana</MenuItem>
                  <MenuItem value="mes">Este Mês</MenuItem>
                  <MenuItem value="personalizado">Personalizado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {periodFilter === 'personalizado' && (
              <>
                <Grid item xs={12} md={1}>
                  <TextField
                    fullWidth
                    label="Início"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={1}>
                  <TextField
                    fullWidth
                    label="Fim"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        )}
      </Paper>
    )}

      <TransactionModal open={modalOpen} handleClose={handleCloseModal} onSave={handleSaveTransaction} transactionToEdit={editingTransaction} caixas={caixas} categorias={categorias} />
      {renderContent()}
    </Box>
  );
}