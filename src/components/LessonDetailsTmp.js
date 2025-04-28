import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import Navbar from './Navbar';
import './LessonDetailsTmp.css';

/**
 * Улучшенный компонент для отображения детальной информации об уроке
 */
const LessonDetailsTmp = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [parsedContent, setParsedContent] = useState(null);
  const [rawContent, setRawContent] = useState('');

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
        
        // Пробуем распарсить контент урока, если он есть
        if (lessonResponse.data.content) {
          try {
            // Проверяем, начинается ли контент с символа {, что может указывать на JSON
            if (lessonResponse.data.content.trim().startsWith('{')) {
              const contentData = JSON.parse(lessonResponse.data.content);
              setParsedContent(contentData);
            } else {
              // Если контент не похож на JSON, используем его как обычный текст
              setParsedContent(null);
              setRawContent(lessonResponse.data.content);
            }
          } catch (err) {
            console.error('Ошибка при парсинге контента урока:', err);
            // Если не удалось распарсить JSON, используем контент как обычный HTML/текст
            setParsedContent(null);
            setRawContent(lessonResponse.data.content);
          }
        }
        
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
      
      await axios.put(API.ENROLLMENTS.LESSONS.COMPLETE(lessonId), {}, {
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

  // Переход к тесту
  const goToTest = (testId, accessToken) => {
    navigate(`/tests/${testId}?token=${accessToken}`);
  };

  /**
   * Рендерит блоки контента Editor.js
   * @param {Object} content - объект с данными Editor.js
   * @returns {JSX.Element} - отрендеренный контент
   */
  const renderEditorContent = (content) => {
    if (!content || !content.blocks || content.blocks.length === 0) {
      return (
        <div className="lesson-tmp-no-content">
          <div className="lesson-tmp-no-content-icon">📝</div>
          <p>Содержание урока отсутствует.</p>
        </div>
      );
    }

    return (
      <div className="lesson-tmp-editor-content">
        {content.blocks.map((block, index) => {
          switch (block.type) {
            case 'header':
              const HeaderTag = `h${block.data.level}`;
              return (
                <HeaderTag key={index} className="lesson-tmp-header-block"
                   dangerouslySetInnerHTML={{ __html: block.data.text }} />
              );
              
            case 'paragraph':
              return (
                <p key={index} className="lesson-tmp-paragraph-block" 
                   dangerouslySetInnerHTML={{ __html: block.data.text }} />
              );
              
            case 'list':
              const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
              return (
                <ListTag key={index} className="lesson-tmp-list-block">
                  {block.data.items.map((item, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ListTag>
              );
              
            case 'code':
              return (
                <div key={index} className="lesson-tmp-code-block">
                  <pre>
                    <code>{block.data.code}</code>
                  </pre>
                </div>
              );
              
            case 'quote':
              return (
                <blockquote key={index} className="lesson-tmp-quote-block">
                  <p dangerouslySetInnerHTML={{ __html: block.data.text }} />
                  {block.data.caption && (
                    <cite>{block.data.caption}</cite>
                  )}
                </blockquote>
              );
              
            case 'delimiter':
              return <hr key={index} className="lesson-tmp-delimiter" />;
              
            default:
              return (
                <div key={index} className="lesson-tmp-unknown-block">
                  Неподдерживаемый тип блока: {block.type}
                </div>
              );
          }
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="lesson-tmp-loading">
          <div className="lesson-tmp-spinner"></div>
          <p>Загрузка информации об уроке...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="lesson-tmp-error">
          <div className="lesson-tmp-error-icon">!</div>
          <p>{error}</p>
          <button onClick={() => navigate('/home')} className="lesson-tmp-button">
            Вернуться к списку курсов
          </button>
        </div>
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <Navbar />
        <div className="lesson-tmp-error">
          <div className="lesson-tmp-error-icon">?</div>
          <p>Урок не найден</p>
          <button onClick={() => navigate('/home')} className="lesson-tmp-button">
            Вернуться к списку курсов
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="lesson-tmp-container">
        <div className="lesson-tmp-content-wrapper">
          <div className="lesson-tmp-header">
            {courseId && (
              <button onClick={() => navigate(`/courses/${courseId}`)} className="lesson-tmp-header-back-button">
                ←
              </button>
            )}
            <div className="lesson-tmp-header-content">
              <h1 className="lesson-tmp-title">{lesson.title}</h1>
            </div>
          </div>

          <div className="lesson-tmp-content">
            <div className="lesson-tmp-main">
              <div className="lesson-tmp-content-section">
                <h2 className="lesson-tmp-section-title">
                  <span className="lesson-tmp-section-icon">📖</span>
                  Содержание урока
                </h2>
                
                {parsedContent ? (
                  renderEditorContent(parsedContent)
                ) : rawContent ? (
                  <div className="lesson-tmp-raw-content">
                    <div dangerouslySetInnerHTML={{ __html: rawContent }} />
                  </div>
                ) : (
                  <div className="lesson-tmp-no-content">
                    <div className="lesson-tmp-no-content-icon">📝</div>
                    <p>Содержание урока отсутствует.</p>
                  </div>
                )}
              </div>
              
              <div className="lesson-tmp-tests-section">
                <h2 className="lesson-tmp-section-title">
                  <span className="lesson-tmp-section-icon">✓</span>
                  Тесты по уроку
                </h2>
                
                {tests.length > 0 ? (
                  <div className="lesson-tmp-tests-list">
                    {tests.map((test) => (
                      <div 
                        key={test.testId} 
                        className={`lesson-tmp-test-card ${activeTest === test.testId ? 'active' : ''}`}
                        onClick={() => setActiveTest(test.testId)}
                      >
                        <div className="lesson-tmp-test-info">
                          <h3 className="lesson-tmp-test-title">{test.testTitle}</h3>
                          {test.description && (
                            <p className="lesson-tmp-test-description">{test.description}</p>
                          )}
                          {test.completed && (
                            <div className="lesson-tmp-test-score">
                              <span className="lesson-tmp-score-icon">🏆</span>
                              <span>Оценка: {test.score !== null ? `${test.score}` : 'Не оценено'}</span>
                            </div>
                          )}
                        </div>
                        
                        <button 
                          className="lesson-tmp-test-button" 
                          onClick={() => goToTest(test.testId, test.accessToken)}
                        >
                          {test.completed ? 'Просмотреть' : 'Пройти тест'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="lesson-tmp-no-tests">
                    <div className="lesson-tmp-no-tests-icon">📋</div>
                    <p>Для этого урока пока нет доступных тестов.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lesson-tmp-sidebar">
              <div className="lesson-tmp-sidebar-section">
                <h3 className="lesson-tmp-sidebar-title">Об уроке</h3>
                <div className="lesson-tmp-sidebar-content">
                  <div className="lesson-tmp-sidebar-item">
                    <span className="lesson-tmp-sidebar-icon">📚</span>
                    <span>Курс: {lesson.courseTitle || 'Не указан'}</span>
                  </div>
                  {lesson.orderNumber !== null && lesson.orderNumber !== undefined && (
                    <div className="lesson-tmp-sidebar-item">
                      <span className="lesson-tmp-sidebar-icon">🔢</span>
                      <span>Урок №{lesson.orderNumber}</span>
                    </div>
                  )}
                  {lesson.authorName && (
                    <div className="lesson-tmp-sidebar-item">
                      <span className="lesson-tmp-sidebar-icon">👨‍🏫</span>
                      <span>Автор: {lesson.authorName}</span>
                    </div>
                  )}
                  {tests.length > 0 && (
                    <div className="lesson-tmp-sidebar-item">
                      <span className="lesson-tmp-sidebar-icon">✓</span>
                      <span>{tests.length} {getTestsWord(tests.length)}</span>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="lesson-tmp-sidebar-item lesson-tmp-completed-item">
                      <span className="lesson-tmp-sidebar-icon">✅</span>
                      <span>Урок завершен</span>
                    </div>
                  )}
                  {!isCompleted && (
                    <div className="lesson-tmp-sidebar-item">
                      <span className="lesson-tmp-sidebar-icon">⏳</span>
                      <span>Урок не завершен</span>
                    </div>
                  )}
                  {lesson.createdAt && (
                    <div className="lesson-tmp-sidebar-item">
                      <span className="lesson-tmp-sidebar-icon">📅</span>
                      <span>Создан: {new Date(lesson.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {lesson.updatedAt && lesson.updatedAt !== lesson.createdAt && (
                    <div className="lesson-tmp-sidebar-item">
                      <span className="lesson-tmp-sidebar-icon">🔄</span>
                      <span>Обновлен: {new Date(lesson.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {!isCompleted && (
                <div className="lesson-tmp-sidebar-cta">
                  <p>Не забудьте отметить урок как завершенный после изучения материала</p>
                  <button 
                    className="lesson-tmp-sidebar-button" 
                    onClick={handleCompleteLesson}
                    disabled={completionLoading}
                  >
                    {completionLoading ? 'Отмечаем...' : 'Отметить как завершенный'}
                  </button>
                </div>
              )}
              
              {tests.length > 0 && (
                <div className="lesson-tmp-sidebar-tests">
                  <h3 className="lesson-tmp-sidebar-title">Доступные тесты</h3>
                  <div className="lesson-tmp-sidebar-tests-list">
                    {tests.map((test) => (
                      <div key={test.testId} className="lesson-tmp-sidebar-test-item">
                        <span className="lesson-tmp-sidebar-test-icon">
                          {test.completed ? '✅' : '📝'}
                        </span>
                        <span className="lesson-tmp-sidebar-test-name">{test.testTitle}</span>
                        {test.completed && test.score !== null && (
                          <span className="lesson-tmp-sidebar-test-score">{test.score}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Вспомогательная функция для склонения слова "тест"
function getTestsWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return 'тестов';
  }
  
  if (lastDigit === 1) {
    return 'тест';
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'теста';
  }
  
  return 'тестов';
}

export default LessonDetailsTmp;
