// src/components/DashboardSummary.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery
} from '@mui/material';

import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import StatCard from './StatCard';
import StatusPill from './StatusPill';
import { API_BASE_URL } from '../config';
import { titleCase } from '../utils/titlecase';

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getProductStatus = (quantity) => {
  if (quantity === 0) return 'Em Falta';
  if (quantity <= 20) return 'Nível Baixo';
  return 'Em Estoque';
};

export default function DashboardSummary({ refreshKey = 0 }) {
  const [stats, setStats] = useState({
    vendasHoje: 0,
    despesasHoje: 0,
    lucroHoje: 0,
    valorEstoque: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

        // Transações recentes
        const sortedTransactions = [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        setRecentTransactions(sortedTransactions.slice(0, 5));

        // Estoque baixo
        const lowStock = produtos
          .filter(p => ['Em Falta', 'Nível Baixo'].includes(getProductStatus(p.quantidade)))
          .sort((a, b) => a.quantidade - b.quantidade);
        setLowStockItems(lowStock.slice(0, 3));

      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3, py: 2 }}>
      {/* Estatísticas principais com StatCard */}
      <Box container spacing={2} mb={3}>
        {[
          {
            title: "Vendas de Hoje",
            value: stats.vendasHoje,
            icon: <PointOfSaleIcon sx={{ fontSize: 40, color: 'green' }}/>
          },
          {
            title: "Despesas de Hoje",
            value: stats.despesasHoje,
            icon: <ShoppingCartIcon sx={{ fontSize: 40, color: 'red' }} />
          },
          {
            title: "Lucro de Hoje",
            value: stats.lucroHoje,
            icon: <MonetizationOnIcon sx={{ fontSize: 40, color: 'blue' }} />
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} mb={2} key={index}>
            <StatCard
              title={stat.title}
              value={formatCurrency(stat.value)}
              icon={stat.icon}
            />
          </Grid>
        ))}
      </Box>

      {/* Estoque Baixo + Transações Recentes */}
      <Box container spacing={2} direction={isMobile ? 'column' : 'row'}>
        {/* Estoque Baixo */}
        <Grid item xs={12} md={6} mb={3}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Alerta de Estoque Baixo</Typography>
            <List dense>
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <ListItem key={item.id}>
                    <ListItemIcon>
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
                <Typography variant="body2" color="text.secondary">
                  Nenhum item com estoque baixo.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Transações Recentes */}
        <Box item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Atividade Recente</Typography>
            <List dense>
              {recentTransactions.map(t => (
                <ListItem key={t.id}>
                  <ListItemIcon>
                    {t.tipo === 'entrada' ? <ArrowUpwardIcon color="success" /> : <ArrowDownwardIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={titleCase(t.descricao)}
                    secondary={new Date(t.data).toLocaleDateString('pt-BR')}
                  />
                  <Typography
                    color={t.tipo === 'entrada' ? 'green' : 'red'}
                    fontWeight="bold"
                  >
                    {formatCurrency(t.valor)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
