import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import TeacherCourses from './TeacherCourses';
import './Profile.css';

/**
 * Компонент профиля пользователя
 * Отображает разный интерфейс в зависимости от роли пользователя (студент/преподаватель)
 */
function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  // Получение данных пользователя при загрузке компонента
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        setLoading(true);
        const response = await axios.get(API.USERS.PROFILE, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUserData(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
        setLoading(false);
        
        // Если токен недействителен, перенаправляем на страницу входа
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };
    
    fetchUserData();
  }, [navigate]);

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Переключение между вкладками (для преподавателя)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Сбрасываем форму создания курса при смене вкладки
    setShowCreateForm(false);
  };
  
  // Обработка нажатия на кнопку создания курса
  const handleCreateCourseClick = () => {
    console.log('Нажата кнопка создания курса в UserProfile');
    setShowCreateForm(true);
  };

  // Отображение загрузки
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка данных профиля...</p>
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/login')} className="primary-button">
            Вернуться на страницу входа
          </button>
        </div>
      </div>
    );
  }

  console.log('Полученные данные пользователя:', userData);
  
  // Отображение профиля студента
  if (userData && (userData.role === 'USER')){
    return (
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-text">{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
          </div>
          <h1>Профиль студента</h1>
        </div>
        
        <div className="profile-card">
          <div className="profile-info">
            <div className="info-group">
              <label>Имя:</label>
              <p>{userData.firstName}</p>
            </div>
            <div className="info-group">
              <label>Фамилия:</label>
              <p>{userData.lastName}</p>
            </div>
            <div className="info-group">
              <label>Email:</label>
              <p>{userData.email}</p>
            </div>
            <div className="info-group">
              <label>Роль:</label>
              <p>Студент</p>
            </div>
          </div>
          
          <div className="student-stats">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <h3>Курсов записано</h3>
                <p className="stat-value">0</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <h3>Курсов завершено</h3>
                <p className="stat-value">0</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-info">
                <h3>Средняя оценка</h3>
                <p className="stat-value">0.0</p>
              </div>
            </div>
          </div>
          
          <button onClick={handleLogout} className="logout-button">
            Выйти из аккаунта
          </button>
        </div>
      </div>
    );
  }

  // Отображение профиля преподавателя
  if (userData && (userData.role === 'TEACHER' || userData.role === 'ROLE_TEACHER')) {
    return (
      <div className="profile-container">
        <div className="profile-header teacher-header">
          <div className="profile-avatar teacher-avatar">
            <span className="avatar-text">{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
          </div>
          <h1>Профиль преподавателя</h1>
        </div>
        
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              Профиль
            </button>
            <button 
              className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => handleTabChange('courses')}
            >
              Мои курсы
            </button>
          </div>
        </div>
        
        {activeTab === 'profile' ? (
          <div className="profile-card">
            <div className="profile-info">
              <div className="info-group">
                <label>Имя:</label>
                <p>{userData.firstName}</p>
              </div>
              <div className="info-group">
                <label>Фамилия:</label>
                <p>{userData.lastName}</p>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <p>{userData.email}</p>
              </div>
              <div className="info-group">
                <label>Роль:</label>
                <p>Преподаватель</p>
              </div>
            </div>
            
            <div className="teacher-stats">
              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>Созданных курсов</h3>
                  <p className="stat-value">0</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👨‍🎓</div>
                <div className="stat-info">
                  <h3>Студентов</h3>
                  <p className="stat-value">0</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <h3>Рейтинг</h3>
                  <p className="stat-value">0.0</p>
                </div>
              </div>
            </div>
            
            <button onClick={handleLogout} className="logout-button">
              Выйти из аккаунта
            </button>
          </div>
        ) : (
          <div className="courses-container">
            <TeacherCourses userData={userData} />
          </div>
        )}
      </div>
    );
  }

  // Если данные не загрузились или роль не определена
  return (
    <div className="profile-container">
      <div className="error-message">
        <p>Не удалось определить роль пользователя. Пожалуйста, попробуйте войти снова.</p>
        <button onClick={() => navigate('/login')} className="primary-button">
          Вернуться на страницу входа
        </button>
      </div>
    </div>
  );
}

export default UserProfile;