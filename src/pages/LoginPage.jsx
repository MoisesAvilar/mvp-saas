import React, { useState}  from 'react';
import { Box, Card, Typography, TextField, Button, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showNotification } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simula uma pequena demora da API
    setTimeout(() => {
      const success = login(email, password);
      if (!success) {
        showNotification('Email ou senha inválidos.', 'error');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Card sx={{ p: 4, width: 400, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            margin="normal"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            required
            margin="normal"
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}