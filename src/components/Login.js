import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './Login.css';
import './AuthBackground.css';

function Login() {
  const [userData, setUserData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Проверяем, есть ли сообщение об успешной регистрации
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Очищаем state, чтобы сообщение не появлялось после обновления страницы
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await axios.post(API.AUTH.SIGNIN, userData);
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.data.token);
      
      // Сохраняем данные пользователя
      localStorage.setItem('user', JSON.stringify({
        id: response.data.id,
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        role: response.data.role
      }));
      
      console.log('Полученные данные пользователя при входе:', response.data);
      
      // Перенаправляем на страницу профиля
      navigate('/profile');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-background">
        <div className="education-icons">
          <div className="icon icon-book">📚</div>
          <div className="icon icon-pencil">✏️</div>
          <div className="icon icon-graduation">🎓</div>
          <div className="icon icon-lightbulb">💡</div>
          <div className="icon icon-computer">💻</div>
        </div>
      </div>
      <div className="login-container">
        <h2>Вход в аккаунт</h2>
        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="login-icon">
          <span>👤</span>
        </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            required
            placeholder="Введите ваш email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            required
            placeholder="Введите ваш пароль"
          />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p className="register-link">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
    </>
  );
}

export default Login;