// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // Se não há usuário logado, redireciona para a página de login
    return <Navigate to="/login" />;
  }

  // Se há usuário, renderiza a página que foi pedida
  return children;
}