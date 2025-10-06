// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import StatusPill from '../components/StatusPill';

// Ícones
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { titleCase } from '../utils/titlecase.js';
import { API_BASE_URL } from '../config';
import StatCard from '../components/StatCard';

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------------------------------------------------------------------
// DASHBOARD PAGE
// ---------------------------------------------------------------------
export default function DashboardPage() {
  const [stats, setStats] = useState({
    vendasHoje: 0,
    despesasHoje: 0,
    lucroHoje: 0,
    valorEstoque: 0
  });
  const [chartData, setChartData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getProductStatus = (quantity) => {
    if (quantity === 0) return 'Em Falta';
    if (quantity <= 20) return 'Nível Baixo';
    return 'Em Estoque';
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [transacoesRes, produtosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/transacoes`),
          axios.get(`${API_BASE_URL}/produtos`)
        ]);

        const transacoes = transacoesRes.data;
        const produtos = produtosRes.data;

        const hoje = new Date().toISOString().slice(0, 10);

        const vendasHoje = transacoes
          .filter(t => t.tipo === 'entrada' && t.data.slice(0, 10) === hoje)
          .reduce((acc, t) => acc + t.valor, 0);

        const despesasHoje = transacoes
          .filter(t => t.tipo === 'saida' && t.data.slice(0, 10) === hoje)
          .reduce((acc, t) => acc + t.valor, 0);

        const lucroHoje = vendasHoje - despesasHoje;

        const valorEstoque = produtos.reduce((acc, p) => acc + p.quantidade * p.custoUnitario, 0);

        setStats({ vendasHoje, despesasHoje, lucroHoje, valorEstoque });

        // --- Gráfico últimos 7 dias ---
        const last7Days = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          last7Days[key] = { name: label, vendas: 0, despesas: 0 };
        }

        transacoes.forEach(t => {
          const dateKey = t.data.slice(0, 10);
          if (last7Days[dateKey]) {
            if (t.tipo === 'entrada') last7Days[dateKey].vendas += t.valor;
            else last7Days[dateKey].despesas += t.valor;
          }
        });
        setChartData(Object.values(last7Days));

        // --- Estoque baixo ---
        const lowStock = produtos
          .filter(p => ['Em Falta', 'Nível Baixo'].includes(getProductStatus(p.quantidade)))
          .sort((a, b) => a.quantidade - b.quantidade);
        setLowStockItems(lowStock);

        // --- Últimas transações ---
        const sortedTransactions = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        setRecentTransactions(sortedTransactions.slice(0, 5));
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // ---------------------------------------------------------------------
  // RENDER MOBILE-FIRST
  // ---------------------------------------------------------------------
  return (
    <Box>
      <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container columnSpacing={2} rowSpacing={2} mb={4}>
        {[
          { title: "Vendas de Hoje", value: stats.vendasHoje, icon: <PointOfSaleIcon sx={{ fontSize: 40, color: 'green' }} /> },
          { title: "Despesas de Hoje", value: stats.despesasHoje, icon: <ShoppingCartIcon sx={{ fontSize: 40, color: 'red' }} /> },
          { title: "Lucro de Hoje", value: stats.lucroHoje, icon: <MonetizationOnIcon sx={{ fontSize: 40, color: 'blue' }} /> },
          { title: "Valor em Estoque", value: stats.valorEstoque, icon: <InventoryIcon sx={{ fontSize: 40, color: 'orange' }} /> }
        ].map((stat, index) => (
          <Box key={index} sx={{ flex: '1 1 0', mx: 0}}>
            <StatCard title={stat.title} value={formatCurrency(stat.value)} icon={stat.icon} />
          </Box>
        ))}
      </Grid>

      {/* Gráfico */}
      <Box mb={4} sx={{ width: '100%', height: '100%' }}>
        <Paper sx={{ p: 2, height: isMobile ? 350 : 420}}>
          <Typography variant="h6" gutterBottom>Atividade Últimos 7 Dias</Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                tickFormatter={(value) => value.toLocaleString('pt-BR')} // apenas números
              />
              <Tooltip 
                formatter={(value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` // R$ só no tooltip
                }
              />
              <Legend />
              <Bar dataKey="vendas" fill="#4caf50" name="Vendas" />
              <Bar dataKey="despesas" fill="#f44336" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* Estoque Baixo + Transações Recentes */}
      <Grid
        container
        spacing={2}
        sx={{ width: '100%' }} // garante que o container ocupe toda largura disponível
        direction={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'flex-start'}
      >
        {/* Estoque baixo */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',  // garante largura completa do grid item
          }}
        >
          <Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Alerta de Estoque Baixo</Typography>
            <List dense sx={{ flex: 1 }}>
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 3).map(item => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <WarningAmberIcon color={getProductStatus(item.quantidade) === 'Em Falta' ? 'error' : 'warning'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={titleCase(item.nome)}
                      secondary={`Restam: ${item.quantidade}`}
                    />
                    <StatusPill status={getProductStatus(item.quantidade)} />
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Nenhum item com estoque baixo.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Transações recentes */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',  // garante largura completa do grid item
          }}
        >
          <Paper sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Typography variant="h6" gutterBottom>Atividade Recente</Typography>
            <List dense sx={{ flex: 1, overflowY: 'auto' }}>
              {recentTransactions.map(t => (
                <ListItem
                  key={t.id}
                  disablePadding
                  sx={{
                    mb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {t.tipo === 'entrada' ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                    </ListItemIcon>

                    <ListItemText
                      primary={titleCase(t.descricao)}
                      secondary={new Date(t.data).toLocaleDateString('pt-BR')}
                      sx={{ minWidth: 0 }}
                    />
                  </Box>

                  <Typography
                    color={t.tipo === 'entrada' ? 'green' : 'red'}
                    fontWeight="bold"
                    noWrap
                    sx={{ ml: 2, flexShrink: 0 }}
                  >
                    {formatCurrency(t.valor)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
