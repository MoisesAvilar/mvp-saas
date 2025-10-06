// src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Verifica se o usuário já está logado no localStorage ao carregar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Função de Login "Fake"
  const login = (email, password) => {
    // Lógica de autenticação real iria aqui (chamada para a API)
    if (email === 'admin@admin.com' && password === '1234') {
      const userData = { email, name: 'Admin' };
      localStorage.setItem('user', JSON.stringify(userData)); // Salva o usuário no storage
      setUser(userData);
      navigate('/'); // Redireciona para o dashboard após o login
      return true;
    }
    // Se a senha/email estiverem errados
    return false;
  };

  // Função de Logout
  const logout = () => {
    localStorage.removeItem('user'); // Remove o usuário do storage
    setUser(null);
    navigate('/login'); // Redireciona para a página de login
  };

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}