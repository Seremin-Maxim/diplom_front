import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import TeacherCourses from './TeacherCourses';
import './Profile.css';
import Navbar from './Navbar';

/**
 * Компонент профиля пользователя
 * Отображает разный интерфейс в зависимости от роли пользователя (студент/преподаватель)
 */
function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [teacherStats, setTeacherStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
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
        console.log('Полученные данные пользователя в Profile.js:', response.data);
        console.log('Роль пользователя:', response.data.role);
        console.log('Тип роли:', typeof response.data.role);
        
        // Проверяем данные из localStorage
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Данные пользователя из localStorage:', localUser);
        console.log('Роль из localStorage:', localUser.role);
        
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

  // Получение статистики для преподавателя
  useEffect(() => {
    const fetchTeacherStats = async () => {
      if (!userData || (userData.role !== 'TEACHER' && userData.role !== 'ROLE_TEACHER')) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      try {
        const response = await axios.get(API.STATISTICS.TEACHER_ME, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Статистика преподавателя:', response.data);
        setTeacherStats(response.data);
      } catch (error) {
        console.error('Ошибка при получении статистики преподавателя:', error);
      }
    };

    fetchTeacherStats();
  }, [userData]);

  // Получение статистики для студента
  useEffect(() => {
    const fetchStudentStats = async () => {
      if (!userData || !(userData.role === 'USER' || userData.role === 'ROLE_USER' || userData.role === 'STUDENT' || userData.role === 'ROLE_STUDENT')) {
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      try {
        // Получаем список курсов, на которые записан студент
        const enrolledCoursesResponse = await axios.get(API.ENROLLMENTS.COURSES.STUDENT_COURSES, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const enrolledCourses = enrolledCoursesResponse.data;
        console.log('Курсы студента:', enrolledCourses);
        
        // Подсчитываем количество завершенных курсов
        let completedCourseCount = 0;
        let totalTestCount = 0;
        let completedTestCount = 0;
        let totalGradeSum = 0;
        let gradedTestCount = 0;
        
        // Проверяем завершенные курсы
        for (const course of enrolledCourses) {
          if (course.completed) {
            completedCourseCount++;
          }
          
          // Получаем уроки курса
          try {
            const lessonsResponse = await axios.get(API.LESSONS.BY_COURSE_ID(course.id), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            const lessons = lessonsResponse.data;
            
            // Для каждого урока получаем тесты
            for (const lesson of lessons) {
              try {
                const testsResponse = await axios.get(API.TESTS_ACCESS.AVAILABLE_TESTS(lesson.id), {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                const tests = testsResponse.data;
                totalTestCount += tests.length;
                
                // Подсчитываем пройденные тесты и оценки
                for (const test of tests) {
                  if (test.completed) {
                    completedTestCount++;
                    
                    if (test.score !== null) {
                      totalGradeSum += test.score;
                      gradedTestCount++;
                    }
                  }
                }
              } catch (error) {
                console.error(`Ошибка при получении тестов для урока ${lesson.id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Ошибка при получении уроков для курса ${course.id}:`, error);
          }
        }
        
        // Рассчитываем среднюю оценку
        const averageGrade = gradedTestCount > 0 ? (totalGradeSum / gradedTestCount).toFixed(1) : 0;
        
        // Формируем объект статистики
        const stats = {
          courseCount: enrolledCourses.length,
          completedCourseCount: completedCourseCount,
          completedTestCount: completedTestCount,
          averageGrade: averageGrade
        };
        
        console.log('Сформированная статистика студента:', stats);
        setStudentStats(stats);
      } catch (error) {
        console.error('Ошибка при получении статистики студента:', error);
      }
    };

    fetchStudentStats();
  }, [userData]);

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Переключение между вкладками (для преподавателя)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Отображение загрузки
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Загрузка данных профиля...</p>
          </div>
        </div>
      </>
    );
  }

  // Отображение ошибки
  if (error) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => navigate('/login')} className="primary-button">
              Вернуться на страницу входа
            </button>
          </div>
        </div>
      </>
    );
  }

  console.log('Проверка роли перед отображением:', userData?.role);

  // Отображение профиля студента
  if (userData && (userData.role === 'USER' || userData.role === 'ROLE_USER' || userData.role === 'STUDENT' || userData.role === 'ROLE_STUDENT')) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-main-info">
              <div className="profile-avatar">
                <span className="avatar-text">{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
              </div>
              <div>
                <div className="profile-main-title">Профиль студента</div>
              </div>
            </div>
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
                  <p className="stat-value">{studentStats ? studentStats.courseCount : 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <h3>Курсов завершено</h3>
                  <p className="stat-value">{studentStats ? studentStats.completedCourseCount : 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <h3>Средняя оценка</h3>
                  <p className="stat-value">{studentStats ? studentStats.averageGrade : 0.0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Тестов пройдено</h3>
                  <p className="stat-value">{studentStats ? studentStats.completedTestCount : 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Отображение профиля преподавателя
  if (userData && (userData.role === 'TEACHER' || userData.role === 'ROLE_TEACHER')) {
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-main-info">
              <div className="profile-avatar teacher-avatar">
                <span className="avatar-text">{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
              </div>
              <div>
                <div className="profile-main-title">Профиль преподавателя</div>
              </div>
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
              <>
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
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                      <h3>Курсов создано</h3>
                      <p className="stat-value">{teacherStats ? teacherStats.courseCount : 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-info">
                      <h3>Студентов обучено</h3>
                      <p className="stat-value">{teacherStats ? teacherStats.studentCount : 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-info">
                      <h3>Уроков создано</h3>
                      <p className="stat-value">{teacherStats ? teacherStats.lessonCount : 0}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <h3>Тестов создано</h3>
                      <p className="stat-value">{teacherStats ? teacherStats.testCount : 0}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="courses-container">
                <TeacherCourses userData={userData} />
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Если данные не загрузились или роль не определена
  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="error-message">
          <p>Не удалось определить роль пользователя. Пожалуйста, попробуйте войти снова.</p>
          <button onClick={() => navigate('/login')} className="primary-button">
            Вернуться на страницу входа
          </button>
        </div>
      </div>
    </>
  );
}

export default Profile;
