import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Paper, Grid, FormControl, InputLabel, Select, CircularProgress,
  MenuItem, TextField, List, ListItem, ListItemText, IconButton, Divider,
  useMediaQuery, useTheme
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { useNotification } from '../context/NotificationContext';
import { API_BASE_URL } from '../config';
import { titleCase } from '../utils/titlecase';
import ChangeModal from '../components/ChangeModal';
import DashboardSummary from '../components/DashboardSummary';

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function POSPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [produtos, setProdutos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [cart, setCart] = useState([]);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [manualPrice, setManualPrice] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');

  const [isSaleLoading, setIsSaleLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      setIsPageLoading(true);
      try {
        const [produtosRes, caixasRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/produtos`),
          axios.get(`${API_BASE_URL}/caixas`)
        ]);
        setProdutos(produtosRes.data.filter(p => p.quantidade > 0 || p.vendidoPor === 'manual'));
        setFormasPagamento(caixasRes.data);
      } catch (error) {
        showNotification('Erro ao carregar dados iniciais.', 'error');
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedProduct = produtos.find((p) => p.id === selectedProductId);

  const handleAddItemToCart = () => {
    if (!selectedProduct) {
      showNotification('Selecione um produto.', 'warning');
      return;
    }

    let price;
    if (selectedProduct.vendidoPor === 'manual') {
      price = parseFloat(manualPrice);
    } else {
      price = quantity * selectedProduct.precoVenda;
    }

    if (isNaN(price) || price <= 0) {
      showNotification('Valor inválido.', 'error');
      return;
    }

    const cartItem = {
      ...selectedProduct,
      cartId: Date.now(),
      sellQuantity: parseFloat(quantity),
      totalPrice: price
    };

    setCart((prevCart) => [...prevCart, cartItem]);

    setSelectedProductId('');
    setQuantity(1);
    setManualPrice('');
  };

  const handleRemoveFromCart = (cartId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const executeSale = async () => {
    if (cart.length === 0) {
      showNotification('O carrinho está vazio.', 'warning');
      return;
    }
    if (!paymentMethodId) {
      showNotification('Selecione uma forma de pagamento.', 'warning');
      return;
    }

    setIsSaleLoading(true);
    try {
      const saleDescription = cart.map((item) => `${item.sellQuantity}x ${item.nome}`).join(', ');
      const transactionData = {
        descricao: `Venda: ${saleDescription}`,
        valor: totalCart,
        tipo: 'entrada',
        caixaId: paymentMethodId,
        categoriaId: 1,
        data: new Date().toISOString()
      };

      await axios.post(`${API_BASE_URL}/transacoes`, transactionData);

      for (const item of cart) {
        if (item.vendidoPor !== 'manual') {
          const newQuantity = item.quantidade - item.sellQuantity;
          await axios.patch(`${API_BASE_URL}/produtos/${item.id}`, { quantidade: newQuantity });
        }
      }

      setDashboardRefreshKey((prev) => prev + 1);
      showNotification('Venda finalizada com sucesso!', 'success');
      setCart([]);
      setPaymentMethodId('');
    } catch (error) {
      console.error("Erro detalhado:", error.response?.data || error.message);
      showNotification('Erro ao finalizar a venda.', 'error');
    } finally {
      setIsSaleLoading(false);
      setIsChangeModalOpen(false); // Garante que o modal feche
    }
  };

  if (isPageLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }


  const handleFinalizeSale = () => {
    if (cart.length === 0 || !paymentMethodId) {
      showNotification('Carrinho vazio ou forma de pagamento não selecionada.', 'warning');
      return;
    }

    // ID "1" corresponde a "Dinheiro" no db.json
    if (paymentMethodId === '1') {
      setIsChangeModalOpen(true);
    } else {
      executeSale();
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Registrar Venda
      </Typography>

      <ChangeModal
        open={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
        total={totalCart}
        onConfirm={executeSale}
      />

      <Box>
        {/* Formulário de Produto */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <Typography variant="h6">Adicionar Item</Typography>
            <ProductSelector
              produtos={produtos}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
            />
            <QuantityInput
              selectedProduct={selectedProduct}
              quantity={quantity}
              setQuantity={setQuantity}
              manualPrice={manualPrice}
              setManualPrice={setManualPrice}
            />
            <Button
              variant="contained"
              startIcon={<AddShoppingCartIcon />}
              fullWidth
              onClick={handleAddItemToCart}
              disabled={!selectedProductId}
            >
              Adicionar ao Carrinho
            </Button>
          </Paper>
        </Grid>

        {/* Carrinho */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 480,
              width: isDesktop ? '100%' : '100%',
            }}
          >
            <Typography variant="h6">Carrinho</Typography>
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: 300,
                border: '1px solid #ddd',
                borderRadius: 1,
                mt: 1,
                mb: 2
              }}
            >
              <CartList cart={cart} handleRemoveFromCart={handleRemoveFromCart} />
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h5" align="right" sx={{ mb: 2 }}>
              Total: {formatCurrency(totalCart)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <PaymentSelector
                formasPagamento={formasPagamento}
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
              />
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={<ShoppingCartCheckoutIcon />}
                onClick={handleFinalizeSale}
                disabled={isSaleLoading || cart.length === 0}
              >
                {isSaleLoading ? 'Finalizando...' : 'Finalizar Venda'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Box sx={{ mt: 2, mx: -3 }}>
          <DashboardSummary refreshKey={dashboardRefreshKey} />
        </Box>
      </Box>
    </Box>
  );
}

//
// === Subcomponentes internos para clareza ===
//

function ProductSelector({ produtos, selectedProductId, setSelectedProductId }) {
  return (
    <FormControl fullWidth>
      <InputLabel>Produto</InputLabel>
      <Select
        value={selectedProductId}
        label="Produto"
        onChange={(e) => setSelectedProductId(e.target.value)}
      >
        {produtos.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {titleCase(p.nome)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function QuantityInput({ selectedProduct, quantity, setQuantity, manualPrice, setManualPrice }) {
  if (!selectedProduct) return null;

  if (selectedProduct.vendidoPor === 'manual') {
    return (
      <TextField
        fullWidth
        type="number"
        label="Valor (R$)"
        value={manualPrice}
        onChange={(e) => setManualPrice(e.target.value)}
      />
    );
  }

  return (
    <TextField
      fullWidth
      type="number"
      label={selectedProduct.vendidoPor === 'kg' ? 'Peso (kg)' : 'Quantidade'}
      value={quantity}
      onChange={(e) => setQuantity(e.target.value)}
    />
  );
}

function CartList({ cart, handleRemoveFromCart }) {
  if (cart.length === 0) {
    return <Typography color="text.secondary" sx={{ p: 2 }}>Nenhum item adicionado.</Typography>;
  }

  return (
    <List>
      {cart.map((item) => (
        <ListItem
          key={item.cartId}
          secondaryAction={
            <IconButton edge="end" onClick={() => handleRemoveFromCart(item.cartId)}>
              <DeleteIcon />
            </IconButton>
          }
        >
          <ListItemText
            primary={`${item.sellQuantity}${item.vendidoPor === 'kg' ? 'kg' : 'x'} ${titleCase(item.nome)}`}
            secondary={formatCurrency(item.totalPrice)}
          />
        </ListItem>
      ))}
    </List>
  );
}

function PaymentSelector({ formasPagamento, paymentMethodId, setPaymentMethodId }) {
  return (
    <FormControl fullWidth>
      <InputLabel>Forma de Pagamento</InputLabel>
      <Select
        value={paymentMethodId}
        label="Forma de Pagamento"
        onChange={(e) => setPaymentMethodId(e.target.value)}
      >
        {formasPagamento.map((p) => (
          <MenuItem key={p.id} value={p.id}>
            {p.nome}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
