import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './CourseDetails.css';

/**
 * Компонент для отображения детальной информации о курсе
 */
const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  // Загрузка информации о курсе и уроках при монтировании компонента
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Получаем информацию о курсе
        const courseResponse = await axios.get(API.COURSES.BY_ID(courseId), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setCourse(courseResponse.data);
        
        // Получаем список уроков курса
        const lessonsResponse = await axios.get(API.LESSONS.BY_COURSE_ID(courseId), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setLessons(lessonsResponse.data);
        
        // Проверяем, записан ли пользователь на курс
        const enrollmentResponse = await axios.get(API.ENROLLMENTS.COURSES.CHECK_ENROLLMENT(courseId), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setIsEnrolled(enrollmentResponse.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных курса:', err);
        setError('Не удалось загрузить информацию о курсе. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // Функция для записи на курс
  const handleEnrollment = async () => {
    try {
      setEnrollmentLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(API.ENROLLMENTS.COURSES.ENROLL(courseId), {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setIsEnrolled(true);
      // Обновляем список уроков, чтобы получить доступные уроки
      const lessonsResponse = await axios.get(API.LESSONS.BY_COURSE_ID(courseId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setLessons(lessonsResponse.data);
    } catch (err) {
      console.error('Ошибка при записи на курс:', err);
      setError('Не удалось записаться на курс. Пожалуйста, попробуйте позже.');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Загрузка информации о курсе...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!course) {
    return <div className="error-message">Курс не найден</div>;
  }

  return (
    <div className="course-details-container">
      <header className="course-details-header">
        <div className="course-details-nav">
          <button onClick={() => navigate('/home')} className="back-button">
            &larr; Назад к курсам
          </button>
          <Link to="/profile" className="profile-link">Мой профиль</Link>
        </div>
        
        <h1 className="course-title">{course.title}</h1>
        
        {course.description && (
          <div className="course-description">
            <p>{course.description}</p>
          </div>
        )}
        
        <div className="course-meta">
          <div className="course-info">
            <span className="course-author">Автор: {course.authorName || 'Неизвестный'}</span>
            <span className="course-lessons-count">{lessons.length} уроков</span>
          </div>
          
          {!isEnrolled ? (
            <button 
              className="enroll-button" 
              onClick={handleEnrollment}
              disabled={enrollmentLoading}
            >
              {enrollmentLoading ? 'Запись...' : 'Записаться на курс'}
            </button>
          ) : (
            <div className="enrolled-badge">Вы записаны на этот курс</div>
          )}
        </div>
      </header>

      <section className="course-lessons-section">
        <h2>Уроки курса</h2>
        
        {lessons.length === 0 ? (
          <div className="no-lessons-message">
            <p>В этом курсе пока нет уроков.</p>
          </div>
        ) : (
          <div className="lessons-list">
            {lessons.map((lesson, index) => (
              <div key={lesson.id} className="lesson-item">
                <div className="lesson-number">{index + 1}</div>
                <div className="lesson-content">
                  <h3 className="lesson-title">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="lesson-description">{lesson.description}</p>
                  )}
                </div>
                {isEnrolled ? (
                  <Link to={`/lessons/${lesson.id}`} className="view-lesson-button">
                    Перейти к уроку
                  </Link>
                ) : (
                  <span className="lesson-locked">
                    Запишитесь на курс для доступа
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CourseDetails;
