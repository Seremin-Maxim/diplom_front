import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import Navbar from './Navbar';
import './CourseDetailsTmp.css';

/**
 * Улучшенный компонент для отображения детальной информации о курсе
 */
const CourseDetailsTmp = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [teacher, setTeacher] = useState(null);

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
        
        // Получаем информацию о преподавателе, если есть authorId
        if (courseResponse.data.authorId) {
          try {
            // Здесь предполагается, что есть API для получения информации о пользователе по ID
            // Если такого API нет, нужно будет его добавить на бэкенде
            const teacherResponse = await axios.get(`${API.USERS.PROFILE}/${courseResponse.data.authorId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            setTeacher(teacherResponse.data);
          } catch (teacherErr) {
            console.error('Ошибка при загрузке данных преподавателя:', teacherErr);
            // Не устанавливаем ошибку для всего компонента, просто логируем
          }
        }
        
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

  // Переход к уроку
  const goToLesson = (lessonId) => {
    navigate(`/lessons/${lessonId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="course-tmp-loading">
          <div className="course-tmp-spinner"></div>
          <p>Загрузка информации о курсе...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="course-tmp-error">
          <div className="course-tmp-error-icon">!</div>
          <p>{error}</p>
          <button onClick={() => navigate('/home')} className="course-tmp-button">
            Вернуться к списку курсов
          </button>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className="course-tmp-error">
          <div className="course-tmp-error-icon">?</div>
          <p>Курс не найден</p>
          <button onClick={() => navigate('/home')} className="course-tmp-button">
            Вернуться к списку курсов
          </button>
        </div>
      </>
    );
  }

  // Получаем имя преподавателя
  const teacherName = teacher ? 
    `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : 
    course.authorName || 'Преподаватель';

  return (
    <>
      <Navbar />
      <div className="course-tmp-container">
        <div className="course-tmp-content-wrapper">
          <div className="course-tmp-header">
            <button onClick={() => navigate('/home')} className="course-tmp-header-back-button">
              ←
            </button>
            <div className="course-tmp-header-content">
              <h1 className="course-tmp-title">{course.title}</h1>
            </div>
          </div>

          {course.description && (
            <div className="course-tmp-description-block">
              <h2 className="course-tmp-section-title">
                <span className="course-tmp-section-icon">📋</span>
                Описание курса
              </h2>
              <p className="course-tmp-description-text">{course.description}</p>
            </div>
          )}

          <div className="course-tmp-content">
            <div className="course-tmp-lessons-section">
              <h2 className="course-tmp-section-title">
                <span className="course-tmp-section-icon">📝</span>
                Уроки курса
              </h2>
              
              {lessons.length === 0 ? (
                <div className="course-tmp-no-lessons">
                  <div className="course-tmp-no-lessons-icon">📭</div>
                  <p>В этом курсе пока нет уроков</p>
                </div>
              ) : (
                <div className="course-tmp-lessons-list">
                  {lessons.map((lesson, index) => (
                    <div 
                      key={lesson.id} 
                      className={`course-tmp-lesson-card ${activeLesson === lesson.id ? 'active' : ''}`}
                      onClick={() => setActiveLesson(lesson.id)}
                    >
                      <div className="course-tmp-lesson-number">{index + 1}</div>
                      <div className="course-tmp-lesson-info">
                        <h3 className="course-tmp-lesson-title">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="course-tmp-lesson-description">{lesson.description}</p>
                        )}
                      </div>
                      <div className="course-tmp-lesson-action">
                        {isEnrolled ? (
                          <button 
                            className="course-tmp-lesson-button" 
                            onClick={() => goToLesson(lesson.id)}
                          >
                            Перейти
                          </button>
                        ) : (
                          <div className="course-tmp-lesson-locked">
                            <span className="course-tmp-lock-icon">🔒</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="course-tmp-sidebar">
              <div className="course-tmp-sidebar-section">
                <h3 className="course-tmp-sidebar-title">О курсе</h3>
                <div className="course-tmp-sidebar-content">
                  <div className="course-tmp-sidebar-item">
                    <span className="course-tmp-sidebar-icon">👨‍🏫</span>
                    <span>Преподаватель: {teacherName}</span>
                  </div>
                  <div className="course-tmp-sidebar-item">
                    <span className="course-tmp-sidebar-icon">📚</span>
                    <span>{lessons.length} {getLessonsWord(lessons.length)}</span>
                  </div>
                  {isEnrolled && (
                    <div className="course-tmp-sidebar-item">
                      <span className="course-tmp-sidebar-icon">✓</span>
                      <span>Вы записаны на курс</span>
                    </div>
                  )}
                </div>
              </div>
              
              {!isEnrolled && (
                <div className="course-tmp-sidebar-cta">
                  <p>Запишитесь на курс, чтобы получить доступ ко всем урокам</p>
                  <button 
                    className="course-tmp-sidebar-button" 
                    onClick={handleEnrollment}
                    disabled={enrollmentLoading}
                  >
                    {enrollmentLoading ? 'Запись...' : 'Записаться на курс'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Вспомогательная функция для склонения слова "урок"
function getLessonsWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'уроков';
  }
  
  if (lastDigit === 1) {
    return 'урок';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'урока';
  }
  
  return 'уроков';
}

export default CourseDetailsTmp;
