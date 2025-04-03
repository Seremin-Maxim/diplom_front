import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import QuestionEditor from './QuestionEditor';
import './TestEditor.css';

/**
 * Компонент для редактирования теста и его вопросов
 * @param {Object} props - свойства компонента
 * @param {Object} props.test - данные о тесте
 * @param {Function} props.onBack - функция для возврата к списку тестов
 * @returns {JSX.Element} - компонент редактора теста
 */
function TestEditor({ test, onBack }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState(test);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'SINGLE_CHOICE',
    points: 1,
    requiresManualCheck: false
  });
  const [formError, setFormError] = useState(null);

  // Получение вопросов теста при загрузке компонента
  useEffect(() => {
    if (test && test.id) {
      fetchQuestions(test.id);
    }
  }, [test]);

  /**
   * Получение вопросов теста с сервера
   * @param {number} testId - ID теста
   */
  const fetchQuestions = async (testId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Запрашиваем вопросы для теста с ID: ${testId}`);
      
      const response = await axios.get(`${API.QUESTIONS.BY_TEST_ID(testId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Полученные вопросы теста:', response.data);
      setQuestions(response.data);
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении вопросов:', error);
      setError('Не удалось загрузить вопросы. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обновление данных теста
   */
  const handleUpdateTest = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Отправляем запрос на обновление теста ${test.id}:`, testData);
      
      const response = await axios.put(`${API.TESTS.BY_ID(test.id)}`, testData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Тест успешно обновлен:', response.data);
      setTestData(response.data);
      setEditMode(false);
      setError(null);
    } catch (error) {
      console.error('Ошибка при обновлении теста:', error);
      setError(error.response?.data?.error || 'Не удалось обновить тест. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработка изменения полей формы создания вопроса
   * @param {Event} e - событие изменения
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewQuestion({
      ...newQuestion,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Обработка изменения полей формы редактирования теста
   * @param {Event} e - событие изменения
   */
  const handleTestInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestData({
      ...testData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Создание нового вопроса
   * @param {Event} e - событие отправки формы
   */
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!newQuestion.text.trim()) {
      setFormError('Текст вопроса обязателен');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Отправляем запрос на создание вопроса для теста ${test.id}:`, newQuestion);
      
      const response = await axios.post(`${API.QUESTIONS.BY_TEST_ID(test.id)}`, newQuestion, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Вопрос успешно создан:', response.data);
      
      // Добавляем новый вопрос в список и сбрасываем форму
      setQuestions([...questions, response.data]);
      setNewQuestion({
        text: '',
        type: 'SINGLE_CHOICE',
        points: 1,
        requiresManualCheck: false
      });
      setShowCreateForm(false);
      
      // Выбираем созданный вопрос для редактирования
      setSelectedQuestion(response.data);
    } catch (error) {
      console.error('Ошибка при создании вопроса:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать вопрос. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаление вопроса
   * @param {number} questionId - ID вопроса
   */
  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот вопрос? Это действие невозможно отменить.')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API.QUESTIONS.BY_ID(questionId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Удаляем вопрос из списка
      setQuestions(questions.filter(question => question.id !== questionId));
      
      // Если удаляемый вопрос был выбран, сбрасываем выбор
      if (selectedQuestion && selectedQuestion.id === questionId) {
        setSelectedQuestion(null);
      }
    } catch (error) {
      console.error('Ошибка при удалении вопроса:', error);
      setError('Не удалось удалить вопрос. Пожалуйста, попробуйте позже.');
    }
  };

  /**
   * Обработчик выбора вопроса для редактирования
   * @param {Object} question - выбранный вопрос
   */
  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question);
  };

  /**
   * Обработчик возврата к списку вопросов
   */
  const handleBackToQuestions = () => {
    setSelectedQuestion(null);
    // Обновляем список вопросов после редактирования
    fetchQuestions(test.id);
  };

  /**
   * Отображение формы создания вопроса
   * @returns {JSX.Element} - форма создания вопроса
   */
  const renderCreateForm = () => (
    <div className="question-form-container">
      <h3>Создание нового вопроса</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleCreateQuestion} className="question-form">
        <div className="form-group">
          <label htmlFor="text">Текст вопроса*</label>
          <textarea
            id="text"
            name="text"
            value={newQuestion.text}
            onChange={handleInputChange}
            required
            placeholder="Введите текст вопроса"
            rows={4}
          />
        </div>
        <div className="form-group">
          <label htmlFor="type">Тип вопроса</label>
          <select
            id="type"
            name="type"
            value={newQuestion.type}
            onChange={handleInputChange}
          >
            <option value="SINGLE_CHOICE">Один правильный ответ</option>
            <option value="MULTIPLE_CHOICE">Несколько правильных ответов</option>
            <option value="TEXT_INPUT">Текстовый ввод</option>
            <option value="ESSAY">Эссе</option>
            <option value="CODING">Программирование</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="points">Баллы за вопрос</label>
          <input
            type="number"
            id="points"
            name="points"
            value={newQuestion.points}
            onChange={handleInputChange}
            min={1}
            max={100}
          />
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="requiresManualCheck"
              checked={newQuestion.requiresManualCheck}
              onChange={handleInputChange}
            />
            Требуется ручная проверка
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать вопрос'}
          </button>
          <button 
            type="button" 
            className="secondary-button" 
            onClick={() => setShowCreateForm(false)}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );

  /**
   * Отображение информации о тесте с возможностью редактирования
   * @returns {JSX.Element} - информация о тесте
   */
  const renderTestInfo = () => (
    <div className="test-info">
      {editMode ? (
        <div className="test-edit-form">
          <div className="form-group">
            <label htmlFor="title">Название теста*</label>
            <input
              type="text"
              id="title"
              name="title"
              value={testData.title}
              onChange={handleTestInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">Тип теста</label>
            <select
              id="type"
              name="type"
              value={testData.type}
              onChange={handleTestInputChange}
            >
              <option value="SINGLE_CHOICE">Один правильный ответ</option>
              <option value="MULTIPLE_CHOICE">Несколько правильных ответов</option>
              <option value="TEXT_INPUT">Текстовый ввод</option>
              <option value="ESSAY">Эссе</option>
              <option value="CODING">Программирование</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="requiresManualCheck"
                checked={testData.requiresManualCheck}
                onChange={handleTestInputChange}
              />
              Требуется ручная проверка
            </label>
          </div>
          <div className="form-actions">
            <button 
              className="primary-button" 
              onClick={handleUpdateTest}
              disabled={loading}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button 
              className="secondary-button" 
              onClick={() => setEditMode(false)}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className="test-info-display">
          <h2>{testData.title}</h2>
          <div className="test-meta">
            <div className="test-type-badge">
              {testData.type === 'SINGLE_CHOICE' && 'Один правильный ответ'}
              {testData.type === 'MULTIPLE_CHOICE' && 'Несколько правильных ответов'}
              {testData.type === 'TEXT_INPUT' && 'Текстовый ввод'}
              {testData.type === 'ESSAY' && 'Эссе'}
              {testData.type === 'CODING' && 'Программирование'}
            </div>
            {testData.requiresManualCheck && (
              <div className="test-manual-check-badge">
                Требуется ручная проверка
              </div>
            )}
          </div>
          <button 
            className="edit-test-button" 
            onClick={() => setEditMode(true)}
          >
            Редактировать тест
          </button>
        </div>
      )}
    </div>
  );

  /**
   * Отображение списка вопросов
   * @returns {JSX.Element} - компонент списка вопросов
   */
  const renderQuestionsList = () => {
    if (loading && questions.length === 0) {
      return <div className="loading">Загрузка вопросов...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    return (
      <div className="questions-container">
        <div className="questions-header">
          <button className="back-button" onClick={onBack}>
            &larr; Назад к тестам
          </button>
          {renderTestInfo()}
        </div>
        
        <h3 className="questions-title">Вопросы теста ({questions.length})</h3>
        
        <div className="questions-grid">
          {/* Карточка для создания нового вопроса */}
          <div className="question-card add-question-card" onClick={() => setShowCreateForm(true)}>
            <div className="add-question-icon">
              <span>+</span>
            </div>
            <p>Добавить новый вопрос</p>
          </div>
          
          {/* Список существующих вопросов */}
          {questions.map((question, index) => (
            <div key={question.id} className="question-card" onClick={() => handleQuestionSelect(question)}>
              <div className="question-number">Вопрос {index + 1}</div>
              <div className="question-text">
                {question.text}
              </div>
              <div className="question-meta">
                <div className="question-type">
                  {question.type === 'SINGLE_CHOICE' && 'Один правильный ответ'}
                  {question.type === 'MULTIPLE_CHOICE' && 'Несколько правильных ответов'}
                  {question.type === 'TEXT_INPUT' && 'Текстовый ввод'}
                  {question.type === 'ESSAY' && 'Эссе'}
                  {question.type === 'CODING' && 'Программирование'}
                </div>
                <div className="question-points">
                  {question.points} {question.points === 1 ? 'балл' : 
                    (question.points >= 2 && question.points <= 4) ? 'балла' : 'баллов'}
                </div>
              </div>
              {question.requiresManualCheck && (
                <div className="question-manual-check">
                  Требуется ручная проверка
                </div>
              )}
              <div className="question-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="icon-button edit-button" 
                  title="Редактировать вопрос"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuestionSelect(question);
                  }}
                >
                  ✏️
                </button>
                <button 
                  className="icon-button delete-button" 
                  title="Удалить вопрос"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteQuestion(question.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="test-editor">
      {showCreateForm ? (
        renderCreateForm()
      ) : selectedQuestion ? (
        <QuestionEditor question={selectedQuestion} onBack={handleBackToQuestions} />
      ) : (
        renderQuestionsList()
      )}
    </div>
  );
}

export default TestEditor;
