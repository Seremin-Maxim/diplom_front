import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './Home.css';

/**
 * Компонент главной страницы, отображающий все доступные курсы
 */
const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка списка публичных курсов при монтировании компонента
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(API.COURSES.PUBLIC, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCourses(response.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке курсов:', err);
        setError('Не удалось загрузить курсы. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Доступные курсы</h1>
        <Link to="/profile" className="profile-link">Мой профиль</Link>
      </header>

      {loading ? (
        <div className="loading-spinner">Загрузка курсов...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : courses.length === 0 ? (
        <div className="no-courses-message">
          <p>Нет доступных курсов.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
              <div className="course-card-content">
                <h2 className="course-title">{course.title}</h2>
                <p className="course-description">
                  {course.description && course.description.length > 150 
                    ? `${course.description.substring(0, 150)}...` 
                    : course.description}
                </p>
                <div className="course-meta">
                  <span className="course-lessons-count">
                    {course.lessonsCount || 0} уроков
                  </span>
                  <span className="course-author">
                    Автор: {course.authorName || 'Неизвестный'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
