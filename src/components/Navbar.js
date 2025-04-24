import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './Navbar.css';

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const searchRef = useRef(null);
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

  // Обработчик клика вне выпадающего меню поиска
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Функция для поиска курсов
  useEffect(() => {
    const searchCourses = async () => {
      // Проверяем, что длина запроса кратна 2 и больше 1
      if (searchQuery.length > 1 && searchQuery.length % 2 === 0) {
        setIsSearching(true);
        setNoResults(false);
        try {
          const token = localStorage.getItem('token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          const response = await axios.get(API.COURSES.SEARCH(searchQuery), {
            headers
          });
          
          if (response.data.length === 0) {
            setNoResults(true);
          }
          
          setSearchResults(response.data);
          setShowResults(true);
        } catch (error) {
          console.error('Ошибка при поиске курсов:', error);
          setSearchResults([]);
          setNoResults(true);
        } finally {
          setIsSearching(false);
        }
      } else if (searchQuery.length === 0) {
        setSearchResults([]);
        setShowResults(false);
        setNoResults(false);
      }
    };

    searchCourses();
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleCourseClick = (courseId) => {
    setShowResults(false);
    setSearchQuery('');
  };

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

        <div className="navbar-search" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Поиск курсов..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <i className="search-icon"></i>
              </button>
            </div>
          </form>
          
          {showResults && (
            <div className="search-results">
              {isSearching ? (
                <div className="search-loading">
                  <div className="search-spinner"></div>
                  <p>Поиск курсов...</p>
                </div>
              ) : noResults ? (
                <div className="no-search-results">
                  <p>По запросу "{searchQuery}" ничего не найдено</p>
                </div>
              ) : (
                <>
                  <div className="search-results-header">
                    <span>Результаты поиска</span>
                  </div>
                  <div className="search-results-list">
                    {searchResults.map(course => (
                      <Link 
                        to={`/courses/${course.id}`} 
                        key={course.id} 
                        className="search-result-item"
                        onClick={() => handleCourseClick(course.id)}
                      >
                        <div className="search-result-icon">📚</div>
                        <div className="search-result-content">
                          <div className="search-result-title">{course.title}</div>
                          <div className="search-result-author">
                            Автор: {course.authorName || 'Неизвестный'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="search-results-footer">
                      <Link 
                        to={`/courses?search=${encodeURIComponent(searchQuery)}`}
                        className="view-all-results"
                        onClick={() => setShowResults(false)}
                      >
                        Показать все результаты
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

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
