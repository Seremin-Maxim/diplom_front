import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import Navbar from './Navbar';
import './TestDetailsTmp.css';

/**
 * Улучшенный компонент для отображения теста с вопросами и возможностью отправки ответов
 */
const TestDetailsTmp = () => {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Получаем токен доступа из URL
  const queryParams = new URLSearchParams(location.search);
  const accessToken = queryParams.get('token');
  
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [lessonInfo, setLessonInfo] = useState(null);
  
  // Загрузка информации о тесте и вопросах при монтировании компонента
  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!accessToken) {
          setError('Отсутствует токен доступа к тесту');
          setLoading(false);
          return;
        }
        
        // Получаем информацию о тесте
        const testUrl = `/api/tests/access/${testId}?token=${accessToken}`;
        
        const testResponse = await axios.get(testUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setTest(testResponse.data);
        
        // Получаем информацию об уроке, если есть lessonId
        if (testResponse.data.lessonId) {
          try {
            const lessonResponse = await axios.get(API.LESSONS.BY_ID(testResponse.data.lessonId), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            setLessonInfo(lessonResponse.data);
          } catch (err) {
            console.error('Ошибка при загрузке данных урока:', err);
            // Не устанавливаем ошибку, так как это не критично
          }
        }
        
        // Получаем вопросы теста
        const questionsUrl = `/api/questions/test/${testId}`;
        
        const questionsResponse = await axios.get(questionsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Получаем варианты ответов для каждого вопроса
        const questionsWithAnswers = await Promise.all(
          questionsResponse.data.map(async (question) => {
            if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
              try {
                const answersUrl = `/api/answers/question/${question.id}`;
                
                const answersResponse = await axios.get(answersUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                return {
                  ...question,
                  answers: answersResponse.data
                };
              } catch (err) {
                console.error(`Ошибка при получении вариантов ответов для вопроса ${question.id}:`, err);
                return {
                  ...question,
                  answers: []
                };
              }
            } else {
              return question;
            }
          })
        );
        
        setQuestions(questionsWithAnswers);
        
        // Инициализируем объект ответов
        const initialAnswers = {};
        questionsWithAnswers.forEach(question => {
          if (question.type === 'SINGLE_CHOICE') {
            initialAnswers[question.id] = null;
          } else if (question.type === 'MULTIPLE_CHOICE') {
            initialAnswers[question.id] = [];
          } else if (question.type === 'TEXT') {
            initialAnswers[question.id] = '';
          }
        });
        
        setAnswers(initialAnswers);
        
        // Устанавливаем первый вопрос как активный
        if (questionsWithAnswers.length > 0) {
          setActiveQuestion(questionsWithAnswers[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке данных теста:', err);
        setError('Не удалось загрузить информацию о тесте. Пожалуйста, проверьте токен доступа.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestDetails();
  }, [testId, accessToken]);
  
  // Обработчик изменения ответа на вопрос с одним вариантом ответа
  const handleSingleChoiceChange = (questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };
  
  // Обработчик изменения ответа на вопрос с несколькими вариантами ответа
  const handleMultipleChoiceChange = (questionId, answerId, checked) => {
    setAnswers(prev => {
      const currentAnswers = [...(prev[questionId] || [])];
      
      if (checked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, answerId]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(id => id !== answerId)
        };
      }
    });
  };
  
  // Обработчик изменения текстового ответа
  const handleTextAnswerChange = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };
  
  // Проверка, все ли вопросы имеют ответы
  const areAllQuestionsAnswered = () => {
    for (const question of questions) {
      const answer = answers[question.id];
      
      if (question.type === 'SINGLE_CHOICE' && answer === null) {
        return false;
      } else if (question.type === 'MULTIPLE_CHOICE' && (!answer || answer.length === 0)) {
        return false;
      } else if (question.type === 'TEXT' && (!answer || answer.trim() === '')) {
        return false;
      }
    }
    
    return true;
  };
  
  // Отправка ответов на тест
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Формируем объект с ответами для отправки
      const formattedAnswers = [];
      
      for (const question of questions) {
        const questionId = question.id;
        const answer = answers[questionId];
        
        if (question.type === 'SINGLE_CHOICE' && answer !== null) {
          formattedAnswers.push({
            questionId: questionId,
            selectedAnswerIds: [answer],
            textAnswer: null
          });
        } else if (question.type === 'MULTIPLE_CHOICE' && answer && answer.length > 0) {
          formattedAnswers.push({
            questionId: questionId,
            selectedAnswerIds: answer,
            textAnswer: null
          });
        } else if (question.type === 'TEXT' && answer && answer.trim() !== '') {
          formattedAnswers.push({
            questionId: questionId,
            selectedAnswerIds: [],
            textAnswer: answer
          });
        }
      }
      
      const submissionData = {
        testId: parseInt(testId),
        answers: formattedAnswers
      };
      
      // Отправляем ответы
      const response = await axios.post('/api/submissions', submissionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setResult(response.data);
      setSubmitted(true);
    } catch (err) {
      console.error('Ошибка при отправке ответов:', err);
      if (err.response) {
        console.error('Детали ошибки:', err.response.data);
      }
      setError('Не удалось отправить ответы. Пожалуйста, проверьте, что вы ответили на все вопросы.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Возврат к уроку
  const handleBackToLesson = () => {
    if (test && test.lessonId) {
      navigate(`/lessons/${test.lessonId}`);
    } else {
      navigate('/home');
    }
  };
  
  // Переход на главную страницу
  const handleGoToHome = () => {
    navigate('/home');
  };
  
  // Переход к следующему вопросу
  const goToNextQuestion = () => {
    const currentIndex = questions.findIndex(q => q.id === activeQuestion);
    if (currentIndex < questions.length - 1) {
      setActiveQuestion(questions[currentIndex + 1].id);
    }
  };
  
  // Переход к предыдущему вопросу
  const goToPrevQuestion = () => {
    const currentIndex = questions.findIndex(q => q.id === activeQuestion);
    if (currentIndex > 0) {
      setActiveQuestion(questions[currentIndex - 1].id);
    }
  };
  
  // Получение статуса ответа на вопрос (отвечен или нет)
  const getQuestionStatus = (questionId) => {
    const answer = answers[questionId];
    
    const question = questions.find(q => q.id === questionId);
    if (!question) return false;
    
    if (question.type === 'SINGLE_CHOICE' && answer !== null) {
      return true;
    } else if (question.type === 'MULTIPLE_CHOICE' && answer && answer.length > 0) {
      return true;
    } else if (question.type === 'TEXT' && answer && answer.trim() !== '') {
      return true;
    }
    
    return false;
  };
  
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="test-tmp-loading">
          <div className="test-tmp-spinner"></div>
          <p>Загрузка теста...</p>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <Navbar />
        <div className="test-tmp-error">
          <div className="test-tmp-error-icon">!</div>
          <p>{error}</p>
          <button onClick={handleGoToHome} className="test-tmp-button">
            На главную страницу
          </button>
        </div>
      </>
    );
  }
  
  if (!test) {
    return (
      <>
        <Navbar />
        <div className="test-tmp-error">
          <div className="test-tmp-error-icon">?</div>
          <p>Тест не найден</p>
          <button onClick={handleGoToHome} className="test-tmp-button">
            На главную страницу
          </button>
        </div>
      </>
    );
  }
  
  // Отображение результатов после отправки ответов
  if (submitted && result) {
    return (
      <>
        <Navbar />
        <div className="test-tmp-container">
          <div className="test-tmp-result-wrapper">
            <div className="test-tmp-result">
              <div className="test-tmp-result-header">
                <h1 className="test-tmp-result-title">Тест завершен</h1>
                <h2 className="test-tmp-result-subtitle">{test.title}</h2>
              </div>
              
              <div className="test-tmp-result-content">
                {result.score !== null ? (
                  <div className="test-tmp-score-card">
                    <div className="test-tmp-score-icon">🏆</div>
                    <div className="test-tmp-score-details">
                      <div className="test-tmp-score-value">
                        <span className="test-tmp-score-number">{result.score}</span>
                        {result.maxScore && <span className="test-tmp-score-max">/ {result.maxScore}</span>}
                      </div>
                      <div className="test-tmp-score-label">Ваша оценка</div>
                    </div>
                  </div>
                ) : (
                  <div className="test-tmp-pending-review">
                    <div className="test-tmp-pending-icon">⏳</div>
                    <p>Ваш ответ будет проверен преподавателем</p>
                  </div>
                )}
                
                <div className="test-tmp-result-info">
                  {lessonInfo && (
                    <div className="test-tmp-result-lesson">
                      <span className="test-tmp-result-label">Урок:</span>
                      <span className="test-tmp-result-value">{lessonInfo.title}</span>
                    </div>
                  )}
                  <div className="test-tmp-result-questions">
                    <span className="test-tmp-result-label">Вопросов:</span>
                    <span className="test-tmp-result-value">{questions.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="test-tmp-result-actions">
                <button className="test-tmp-result-button test-tmp-lesson-button" onClick={handleBackToLesson}>
                  Вернуться к уроку
                </button>
                <button className="test-tmp-result-button test-tmp-home-button" onClick={handleGoToHome}>
                  На главную страницу
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Находим активный вопрос
  const activeQuestionData = questions.find(q => q.id === activeQuestion);
  const activeQuestionIndex = questions.findIndex(q => q.id === activeQuestion);
  
  return (
    <>
      <Navbar />
      <div className="test-tmp-container">
        <div className="test-tmp-content-wrapper">
          <div className="test-tmp-header">
            <button onClick={handleBackToLesson} className="test-tmp-header-back-button">
              ←
            </button>
            <div className="test-tmp-header-content">
              <h1 className="test-tmp-title">{test.title}</h1>
              
              {test.description && (
                <p className="test-tmp-description">{test.description}</p>
              )}
              
              {test.timeLimit && (
                <div className="test-tmp-time-limit">
                  <span className="test-tmp-time-icon">⏱️</span>
                  <span>Ограничение по времени: {test.timeLimit} минут</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="test-tmp-content">
            <div className="test-tmp-main">
              <div className="test-tmp-questions-progress">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    className={`test-tmp-question-dot ${activeQuestion === question.id ? 'active' : ''} ${getQuestionStatus(question.id) ? 'answered' : ''}`}
                    onClick={() => setActiveQuestion(question.id)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              {activeQuestionData && (
                <div className="test-tmp-question-card">
                  <div className="test-tmp-question-header">
                    <div className="test-tmp-question-number">
                      Вопрос {activeQuestionIndex + 1} из {questions.length}
                    </div>
                    <div className="test-tmp-question-type">
                      {activeQuestionData.type === 'SINGLE_CHOICE' && 'Один вариант ответа'}
                      {activeQuestionData.type === 'MULTIPLE_CHOICE' && 'Несколько вариантов ответа'}
                      {activeQuestionData.type === 'TEXT' && 'Текстовый ответ'}
                    </div>
                  </div>
                  
                  <h3 className="test-tmp-question-text">{activeQuestionData.text}</h3>
                  
                  <div className="test-tmp-answers-container">
                    {activeQuestionData.type === 'SINGLE_CHOICE' && activeQuestionData.answers && (
                      <div className="test-tmp-single-choice">
                        {activeQuestionData.answers.map(answer => (
                          <label key={answer.id} className={`test-tmp-answer-option ${answers[activeQuestionData.id] === answer.id ? 'selected' : ''}`}>
                            <input
                              type="radio"
                              name={`question-${activeQuestionData.id}`}
                              checked={answers[activeQuestionData.id] === answer.id}
                              onChange={() => handleSingleChoiceChange(activeQuestionData.id, answer.id)}
                              className="test-tmp-radio"
                            />
                            <span className="test-tmp-radio-custom"></span>
                            <span className="test-tmp-answer-text">{answer.text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {activeQuestionData.type === 'MULTIPLE_CHOICE' && activeQuestionData.answers && (
                      <div className="test-tmp-multiple-choice">
                        {activeQuestionData.answers.map(answer => (
                          <label key={answer.id} className={`test-tmp-answer-option ${answers[activeQuestionData.id]?.includes(answer.id) ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={answers[activeQuestionData.id]?.includes(answer.id)}
                              onChange={(e) => handleMultipleChoiceChange(activeQuestionData.id, answer.id, e.target.checked)}
                              className="test-tmp-checkbox"
                            />
                            <span className="test-tmp-checkbox-custom"></span>
                            <span className="test-tmp-answer-text">{answer.text}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {activeQuestionData.type === 'TEXT' && (
                      <div className="test-tmp-text-answer">
                        <textarea
                          placeholder="Введите ваш ответ здесь..."
                          value={answers[activeQuestionData.id] || ''}
                          onChange={(e) => handleTextAnswerChange(activeQuestionData.id, e.target.value)}
                          rows={5}
                          className="test-tmp-textarea"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="test-tmp-question-navigation">
                    <button
                      className="test-tmp-prev-button"
                      onClick={goToPrevQuestion}
                      disabled={activeQuestionIndex === 0}
                    >
                      Предыдущий
                    </button>
                    
                    {activeQuestionIndex < questions.length - 1 ? (
                      <button
                        className="test-tmp-next-button"
                        onClick={goToNextQuestion}
                      >
                        Следующий
                      </button>
                    ) : (
                      <button
                        className="test-tmp-submit-button"
                        onClick={handleSubmit}
                        disabled={submitting || !areAllQuestionsAnswered()}
                      >
                        {submitting ? 'Отправка...' : 'Завершить тест'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="test-tmp-sidebar">
              <div className="test-tmp-sidebar-section">
                <h3 className="test-tmp-sidebar-title">О тесте</h3>
                <div className="test-tmp-sidebar-content">
                  {lessonInfo && (
                    <div className="test-tmp-sidebar-item">
                      <span className="test-tmp-sidebar-icon">📚</span>
                      <span>Урок: {lessonInfo.title}</span>
                    </div>
                  )}
                  <div className="test-tmp-sidebar-item">
                    <span className="test-tmp-sidebar-icon">❓</span>
                    <span>Вопросов: {questions.length}</span>
                  </div>
                  {test.timeLimit && (
                    <div className="test-tmp-sidebar-item">
                      <span className="test-tmp-sidebar-icon">⏱️</span>
                      <span>Время: {test.timeLimit} минут</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="test-tmp-sidebar-progress">
                <h3 className="test-tmp-sidebar-title">Прогресс</h3>
                <div className="test-tmp-progress-bar">
                  <div 
                    className="test-tmp-progress-fill" 
                    style={{ width: `${(questions.filter(q => getQuestionStatus(q.id)).length / questions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="test-tmp-progress-stats">
                  <div className="test-tmp-progress-answered">
                    <span className="test-tmp-progress-number">
                      {questions.filter(q => getQuestionStatus(q.id)).length}
                    </span>
                    <span className="test-tmp-progress-label">Отвечено</span>
                  </div>
                  <div className="test-tmp-progress-total">
                    <span className="test-tmp-progress-number">{questions.length}</span>
                    <span className="test-tmp-progress-label">Всего</span>
                  </div>
                </div>
              </div>
              
              <div className="test-tmp-sidebar-actions">
                <button
                  className="test-tmp-sidebar-submit"
                  onClick={handleSubmit}
                  disabled={submitting || !areAllQuestionsAnswered()}
                >
                  {submitting ? 'Отправка...' : 'Завершить тест'}
                </button>
                
                <button className="test-tmp-sidebar-cancel" onClick={handleBackToLesson}>
                  Отменить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestDetailsTmp;
