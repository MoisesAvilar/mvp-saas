// src/pages/ReportsPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  useTheme, useMediaQuery
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { API_BASE_URL } from '../config';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Função para "adivinhar" a categoria da despesa
const guessCategory = (description) => {
  const desc = description.toLowerCase();
  if (desc.includes('compra') || desc.includes('insumo') || desc.includes('carne') || desc.includes('bebida')) return 'Insumos';
  if (desc.includes('luz') || desc.includes('aluguel') || desc.includes('internet') || desc.includes('água')) return 'Contas Fixas';
  if (desc.includes('salário') || desc.includes('pagamento func')) return 'Salários';
  return 'Outros';
};

export default function ReportsPage() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categorias, setCategorias] = useState([]);
  const [period, setPeriod] = useState('mes'); // mes, semana, ano

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [transacoesRes, categoriasRes] = await Promise.all([ // << NOVO
          axios.get(`${API_BASE_URL}/transacoes`),
          axios.get(`${API_BASE_URL}/categorias`), // << NOVO
        ]);
        setTransacoes(transacoesRes.data);
        setCategorias(categoriasRes.data);
      } catch (error) {
        console.error("Erro ao buscar transações:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoiza os dados filtrados e processados para os gráficos
  const reportData = useMemo(() => {
    if (transacoes.length === 0) return { lineData: [], pieData: [] };

    const now = new Date();
    const filtered = transacoes.filter(t => {
      const transactionDate = new Date(t.data);
      if (period === 'semana') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return transactionDate >= oneWeekAgo;
      }
      if (period === 'mes') {
        return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
      }
      if (period === 'ano') {
        return transactionDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Processamento para o gráfico de linha (Vendas vs Despesas por dia)
    const dailyData = {};
    filtered.forEach(t => {
      const day = new Date(t.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!dailyData[day]) {
        dailyData[day] = { name: day, vendas: 0, despesas: 0 };
      }
      if (t.tipo === 'entrada') {
        dailyData[day].vendas += t.valor;
      } else {
        dailyData[day].despesas += t.valor;
      }
    });
    const lineData = Object.values(dailyData).sort((a,b) => a.name.split('/').reverse().join('') > b.name.split('/').reverse().join('') ? 1 : -1);

    const expenseByCategory = {};
    filtered.filter(t => t.tipo === 'saida').forEach(t => {
      const categoryName = categorias.find(c => String(c.id) === String(t.categoriaId))?.nome || 'Sem Categoria';
      if (!expenseByCategory[categoryName]) {
        expenseByCategory[categoryName] = 0;
      }
      expenseByCategory[categoryName] += t.valor;
    });
    const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    return { lineData, pieData };
  }, [transacoes, period, categorias]);

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }
  
  const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <Box sx={{ 
      p: isMobile ? 1 : 3,
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}>
      {/* Cabeçalho */}
      <Box sx={{ flex: '0 0 auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Relatórios
        </Typography>

        <Paper sx={{ p: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Período</InputLabel>
            <Select value={period} label="Período" onChange={(e) => setPeriod(e.target.value)}>
              <MenuItem value="semana">Últimos 7 dias</MenuItem>
              <MenuItem value="mes">Este Mês</MenuItem>
              <MenuItem value="ano">Este Ano</MenuItem>
            </Select>
          </FormControl>
        </Paper>
      </Box>

      {/* Área dos Gráficos - Ocupa todo o espaço restante */}
      <Box sx={{ 
        flex: 1,
        minHeight: 0, // Importante para o flexbox calcular corretamente
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2
      }}>
        {/* Gráfico de Linha - Desempenho Financeiro */}
        <Paper sx={{ 
          flex: isMobile ? 1 : 2, // No desktop ocupa 2/3, no mobile 1/2
          p: isMobile ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <Typography variant="h6" gutterBottom sx={{ 
            px: isMobile ? 1 : 0,
            flex: '0 0 auto'
          }}>
            Desempenho Financeiro
          </Typography>
          <Box sx={{ 
            flex: 1,
            width: '100%',
            minHeight: 0
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={reportData.lineData} 
                margin={{ 
                  top: 5, 
                  right: isMobile ? 10 : 20, 
                  left: isMobile ? -20 : -10, 
                  bottom: 5 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: isMobile ? 12 : 14 }}
                />
                <YAxis 
                  tickFormatter={(val) => formatCurrency(val)}
                  tick={{ fontSize: isMobile ? 12 : 14 }}
                />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#4caf50" 
                  name="Vendas" 
                  strokeWidth={2} 
                  dot={!isMobile}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="#f44336" 
                  name="Despesas" 
                  strokeWidth={2} 
                  dot={!isMobile}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Gráfico de Pizza - Composição das Despesas */}
        <Paper sx={{ 
          flex: 1, // Ocupa 1/3 no desktop, 1/2 no mobile
          p: isMobile ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <Typography variant="h6" gutterBottom sx={{ 
            px: isMobile ? 1 : 0,
            flex: '0 0 auto'
          }}>
            Composição das Despesas
          </Typography>
          <Box sx={{ 
            flex: 1,
            width: '100%',
            minHeight: 0
          }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={reportData.pieData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={isMobile ? '70%' : '80%'} 
                  fill="#8884d8" 
                  label={!isMobile}
                >
                  {reportData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => formatCurrency(val)} />
                {!isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}