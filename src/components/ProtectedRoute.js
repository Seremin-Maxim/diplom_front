import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Если токена нет, перенаправляем на страницу входа
    return <Navigate to="/login" replace />;
  }
  
  // Если токен есть, отображаем защищенный компонент
  return children;
}

export default ProtectedRoute;