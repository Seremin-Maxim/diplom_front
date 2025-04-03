import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './LessonDetails.css';

/**
 * Компонент для отображения детальной информации об уроке
 */
const LessonDetails = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);

  // Загрузка информации об уроке и тестах при монтировании компонента
  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Получаем информацию об уроке
        const lessonResponse = await axios.get(API.LESSONS.BY_ID(lessonId), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setLesson(lessonResponse.data);
        setCourseId(lessonResponse.data.courseId);
        
        // Проверяем, завершил ли пользователь урок
        try {
          const enrollmentResponse = await axios.get(API.ENROLLMENTS.LESSONS.CHECK_COMPLETION(lessonId), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          setIsCompleted(enrollmentResponse.data);
        } catch (err) {
          console.error('Ошибка при проверке завершения урока:', err);
          // Не устанавливаем ошибку, так как это не критично
        }
        
        // Проверяем, записан ли пользователь на урок
        try {
          const enrollmentStatusResponse = await axios.get(API.ENROLLMENTS.LESSONS.CHECK_ENROLLMENT(lessonId), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Если пользователь записан на урок, получаем доступные тесты
          if (enrollmentStatusResponse.data === true) {
            try {
              const testsResponse = await axios.get(API.TESTS_ACCESS.AVAILABLE_TESTS(lessonId), {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              setTests(testsResponse.data);
            } catch (err) {
              console.error('Ошибка при загрузке тестов:', err);
              // Не устанавливаем ошибку, так как это не критично
            }
          } else {
            // Если пользователь не записан на урок, сначала записываем его
            try {
              await axios.post(API.ENROLLMENTS.LESSONS.ENROLL(lessonId), {}, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              // После записи на урок, получаем доступные тесты
              const testsResponse = await axios.get(API.TESTS_ACCESS.AVAILABLE_TESTS(lessonId), {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              setTests(testsResponse.data);
            } catch (enrollErr) {
              console.error('Ошибка при записи на урок:', enrollErr);
            }
          }
        } catch (err) {
          console.error('Ошибка при проверке записи на урок:', err);
        }
        
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных урока:', err);
        setError('Не удалось загрузить информацию об уроке. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonDetails();
  }, [lessonId]);

  // Функция для отметки урока как завершенного
  const handleCompleteLesson = async () => {
    try {
      setCompletionLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(API.ENROLLMENTS.LESSONS.COMPLETE(lessonId), {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setIsCompleted(true);
    } catch (err) {
      console.error('Ошибка при отметке урока как завершенного:', err);
      setError('Не удалось отметить урок как завершенный. Пожалуйста, попробуйте позже.');
    } finally {
      setCompletionLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Загрузка информации об уроке...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!lesson) {
    return <div className="error-message">Урок не найден</div>;
  }

  return (
    <div className="lesson-details-container">
      <header className="lesson-details-header">
        <div className="lesson-details-nav">
          {courseId && (
            <button onClick={() => navigate(`/courses/${courseId}`)} className="back-button">
              &larr; Назад к курсу
            </button>
          )}
          <Link to="/profile" className="profile-link">Мой профиль</Link>
        </div>
        
        <h1 className="lesson-title">{lesson.title}</h1>
        
        <div className="lesson-meta">
          {isCompleted ? (
            <div className="completed-badge">Урок завершен</div>
          ) : (
            <button 
              className="complete-button" 
              onClick={handleCompleteLesson}
              disabled={completionLoading}
            >
              {completionLoading ? 'Отмечаем...' : 'Отметить как завершенный'}
            </button>
          )}
        </div>
      </header>

      <section className="lesson-content-section">
        <h2>Содержание урока</h2>
        
        {lesson.content ? (
          <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        ) : (
          <div className="no-content-message">
            <p>Содержание урока отсутствует.</p>
          </div>
        )}
      </section>

      <section className="lesson-tests-section">
        <h2>Тесты по уроку</h2>
        
        {tests.length > 0 ? (
          <div className="tests-list">
            {tests.map((test) => (
              <div key={test.testId} className="test-item">
                <div className="test-info">
                  <h3 className="test-title">{test.testTitle}</h3>
                  {test.description && (
                    <p className="test-description">{test.description}</p>
                  )}
                  {test.completed && (
                    <div className="test-score">
                      Оценка: {test.score !== null ? `${test.score}` : 'Не оценено'}
                    </div>
                  )}
                </div>
                
                <Link 
                  to={`/tests/${test.testId}?token=${test.accessToken}`} 
                  className="take-test-button"
                  onClick={() => console.log(`Переход к тесту: ${test.testId}, токен: ${test.accessToken}`)}
                >
                  {test.completed ? 'Просмотреть тест' : 'Пройти тест'}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-tests-message">
            <p>Для этого урока пока нет доступных тестов.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default LessonDetails;
