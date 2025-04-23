import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем наличие токена при загрузке компонента
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      // Получаем данные профиля из localStorage, если есть
      const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      setUserProfile(profile);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userProfile');
    setIsAuthenticated(false);
    setUserProfile(null);
    setMenuOpen(false);
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">OpenCourses</span>
          <div className="logo-animation">
            <span className="logo-dot"></span>
            <span className="logo-dot"></span>
            <span className="logo-dot"></span>
          </div>
        </Link>

        <div className="navbar-right">
          {isAuthenticated ? (
            <div className="profile-container">
              <button className="profile-button" onClick={toggleMenu}>
                <div className="avatar">
                  {userProfile?.firstName?.charAt(0) || 'U'}
                </div>
                <span className="username">{userProfile?.firstName || 'Пользователь'}</span>
                <i className={`arrow ${menuOpen ? 'up' : 'down'}`}></i>
              </button>
              
              {menuOpen && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <i className="icon profile-icon"></i>
                    Профиль
                  </Link>
                  <Link to="/my-courses" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <i className="icon courses-icon"></i>
                    Мои курсы
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <i className="icon logout-icon"></i>
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">
                <span>Вход</span>
              </Link>
              <Link to="/register" className="register-button">
                <span>Регистрация</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
