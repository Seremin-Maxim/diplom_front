import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';

/**
 * Компонент для защиты маршрутов, доступных только преподавателям
 * @param {Object} props - свойства компонента
 * @param {React.ReactNode} props.children - дочерние компоненты
 * @returns {JSX.Element} - защищенный компонент или перенаправление
 */
function TeacherProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  
  useEffect(() => {
    const checkUserRole = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Получаем данные пользователя
        const response = await axios.get(API.USERS.PROFILE, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Проверяем, является ли пользователь преподавателем
        const userRole = response.data.role;
        setIsTeacher(userRole === 'TEACHER' || userRole === 'ROLE_TEACHER');
        setLoading(false);
      } catch (error) {
        console.error('Ошибка при проверке роли пользователя:', error);
        setLoading(false);
      }
    };
    
    checkUserRole();
  }, []);
  
  // Отображаем загрузку
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Проверка доступа...</p>
      </div>
    );
  }
  
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Если токена нет, перенаправляем на страницу входа
    return <Navigate to="/login" replace />;
  }
  
  if (!isTeacher) {
    // Если пользователь не преподаватель, перенаправляем на страницу профиля
    return <Navigate to="/profile" replace />;
  }
  
  // Если пользователь преподаватель и токен есть, отображаем защищенный компонент
  return children;
}

export default TeacherProtectedRoute;
