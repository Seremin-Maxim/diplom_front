import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './TestDetails.css';

/**
 * Компонент для отображения теста с вопросами и возможностью отправки ответов
 */
const TestDetails = () => {
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
        
        console.log(`Начинаем загрузку теста ${testId} с токеном ${accessToken}`);
        
        // Получаем информацию о тесте
        const testUrl = `/api/tests/access/${testId}?token=${accessToken}`;
        console.log(`Запрос к ${testUrl}`);
        
        const testResponse = await axios.get(testUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Получены данные теста:', testResponse.data);
        setTest(testResponse.data);
        
        // Получаем вопросы теста
        const questionsUrl = `/api/questions/test/${testId}`;
        console.log(`Запрос вопросов по ${questionsUrl}`);
        
        const questionsResponse = await axios.get(questionsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Получены вопросы:', questionsResponse.data);
        
        // Получаем варианты ответов для каждого вопроса
        const questionsWithAnswers = await Promise.all(
          questionsResponse.data.map(async (question) => {
            if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
              try {
                const answersUrl = `/api/answers/question/${question.id}`;
                console.log(`Запрос вариантов ответов по ${answersUrl}`);
                
                const answersResponse = await axios.get(answersUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                });
                
                console.log(`Получены варианты ответов для вопроса ${question.id}:`, answersResponse.data);
                
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
        
        console.log('Вопросы с вариантами ответов:', questionsWithAnswers);
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
      
      console.log('Текущие ответы:', answers);
      
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
      
      console.log('Подготовленные данные для отправки:', submissionData);
      
      // Отправляем ответы
      const response = await axios.post('/api/submissions', submissionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Ответ сервера:', response.data);
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
      navigate('/profile');
    }
  };
  
  if (loading) {
    return <div className="loading-spinner">Загрузка теста...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (!test) {
    return <div className="error-message">Тест не найден</div>;
  }
  
  // Отображение результатов после отправки ответов
  if (submitted && result) {
    return (
      <div className="test-details-container">
        <div className="test-result">
          <h1>Тест завершен</h1>
          
          <div className="result-info">
            <h2>{test.title}</h2>
            
            {result.score !== null ? (
              <div className="score">
                <p>Ваша оценка: <span className="score-value">{result.score}</span></p>
                {result.maxScore && <p>Максимальная оценка: {result.maxScore}</p>}
              </div>
            ) : (
              <p className="pending-review">Ваш ответ будет проверен преподавателем</p>
            )}
          </div>
          
          <button className="back-button" onClick={handleBackToLesson}>
            Вернуться к уроку
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="test-details-container">
      <header className="test-details-header">
        <h1 className="test-title">{test.title}</h1>
        
        {test.description && (
          <p className="test-description">{test.description}</p>
        )}
        
        {test.timeLimit && (
          <div className="time-limit">
            Ограничение по времени: {test.timeLimit} минут
          </div>
        )}
      </header>
      
      <div className="questions-container">
        {questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <div className="question-header">
              <span className="question-number">Вопрос {index + 1}</span>
              <span className="question-type">
                {question.type === 'SINGLE_CHOICE' && 'Один вариант ответа'}
                {question.type === 'MULTIPLE_CHOICE' && 'Несколько вариантов ответа'}
                {question.type === 'TEXT' && 'Текстовый ответ'}
              </span>
            </div>
            
            <h3 className="question-text">{question.text}</h3>
            
            <div className="answers-container">
              {question.type === 'SINGLE_CHOICE' && question.answers && (
                <div className="single-choice-answers">
                  {question.answers.map(answer => (
                    <label key={answer.id} className="answer-option">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        checked={answers[question.id] === answer.id}
                        onChange={() => handleSingleChoiceChange(question.id, answer.id)}
                      />
                      <span className="answer-text">{answer.text}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'MULTIPLE_CHOICE' && question.answers && (
                <div className="multiple-choice-answers">
                  {question.answers.map(answer => (
                    <label key={answer.id} className="answer-option">
                      <input
                        type="checkbox"
                        checked={answers[question.id]?.includes(answer.id)}
                        onChange={(e) => handleMultipleChoiceChange(question.id, answer.id, e.target.checked)}
                      />
                      <span className="answer-text">{answer.text}</span>
                    </label>
                  ))}
                </div>
              )}
              
              {question.type === 'TEXT' && (
                <div className="text-answer">
                  <textarea
                    placeholder="Введите ваш ответ здесь..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
                    rows={5}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="test-actions">
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={submitting || !areAllQuestionsAnswered()}
        >
          {submitting ? 'Отправка...' : 'Отправить ответы'}
        </button>
        
        <button className="cancel-button" onClick={handleBackToLesson}>
          Отменить
        </button>
      </div>
    </div>
  );
};

export default TestDetails;
