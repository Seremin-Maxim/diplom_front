import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import './QuestionEditor.css';

/**
 * Компонент для редактирования вопроса и его вариантов ответов
 * @param {Object} props - свойства компонента
 * @param {Object} props.question - данные о вопросе
 * @param {Function} props.onBack - функция для возврата к списку вопросов
 * @returns {JSX.Element} - компонент редактора вопроса
 */
function QuestionEditor({ question, onBack }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questionData, setQuestionData] = useState(question);
  const [editMode, setEditMode] = useState(false);
  const [newAnswer, setNewAnswer] = useState({
    text: '',
    isCorrect: false
  });
  const [formError, setFormError] = useState(null);

  // Получение вариантов ответов при загрузке компонента
  useEffect(() => {
    if (question && question.id) {
      fetchAnswers(question.id);
    }
  }, [question]);

  /**
   * Получение вариантов ответов для вопроса с сервера
   * @param {number} questionId - ID вопроса
   */
  const fetchAnswers = async (questionId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Запрашиваем варианты ответов для вопроса с ID: ${questionId}`);
      
      const response = await axios.get(`${API.ANSWERS.BY_QUESTION_ID(questionId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Полученные варианты ответов:', response.data);
      setAnswers(response.data);
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении вариантов ответов:', error);
      setError('Не удалось загрузить варианты ответов. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обновление данных вопроса
   */
  const handleUpdateQuestion = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Отправляем запрос на обновление вопроса ${question.id}:`, questionData);
      
      const response = await axios.put(`${API.QUESTIONS.BY_ID(question.id)}`, questionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Вопрос успешно обновлен:', response.data);
      setQuestionData(response.data);
      setEditMode(false);
      setError(null);
    } catch (error) {
      console.error('Ошибка при обновлении вопроса:', error);
      setError(error.response?.data?.error || 'Не удалось обновить вопрос. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработка изменения полей формы редактирования вопроса
   * @param {Event} e - событие изменения
   */
  const handleQuestionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuestionData({
      ...questionData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Обработка изменения полей формы создания варианта ответа
   * @param {Event} e - событие изменения
   */
  const handleAnswerInputChange = (e) => {
    // Сбрасываем сообщение об ошибке при любом действии пользователя
    setFormError(null);
    
    const { name, value, type, checked } = e.target;
    setNewAnswer({
      ...newAnswer,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Создание нового варианта ответа
   * @param {Event} e - событие отправки формы
   */
  const handleCreateAnswer = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!newAnswer.text.trim()) {
      setFormError('Текст варианта ответа обязателен');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    // Проверка для вопросов с одним правильным ответом
    if (questionData.type === 'SINGLE_CHOICE' && newAnswer.isCorrect && answers.some(answer => answer.isCorrect)) {
      setFormError('Для вопроса с одним правильным ответом может быть только один правильный вариант ответа. Сначала измените существующий правильный ответ на неправильный.');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Отправляем запрос на создание варианта ответа для вопроса ${question.id}:`, newAnswer);
      
      const response = await axios.post(`${API.ANSWERS.BY_QUESTION_ID(question.id)}`, newAnswer, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Вариант ответа успешно создан:', response.data);
      
      // Добавляем новый вариант ответа в список и сбрасываем форму
      setAnswers([...answers, response.data]);
      setNewAnswer({
        text: '',
        isCorrect: false
      });
    } catch (error) {
      console.error('Ошибка при создании варианта ответа:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать вариант ответа. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обновление варианта ответа
   * @param {number} answerId - ID варианта ответа
   * @param {Object} updatedData - обновленные данные
   */
  const handleUpdateAnswer = async (answerId, updatedData) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoading(true);
      
      const response = await axios.put(`${API.ANSWERS.BY_ID(answerId)}`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем вариант ответа в списке
      setAnswers(answers.map(answer => 
        answer.id === answerId ? response.data : answer
      ));
    } catch (error) {
      console.error('Ошибка при обновлении варианта ответа:', error);
      setError('Не удалось обновить вариант ответа. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаление варианта ответа
   * @param {number} answerId - ID варианта ответа
   */
  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот вариант ответа? Это действие невозможно отменить.')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API.ANSWERS.BY_ID(answerId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Удаляем вариант ответа из списка
      setAnswers(answers.filter(answer => answer.id !== answerId));
    } catch (error) {
      console.error('Ошибка при удалении варианта ответа:', error);
      setError('Не удалось удалить вариант ответа. Пожалуйста, попробуйте позже.');
    }
  };

  /**
   * Создание набора вариантов ответов для вопроса с одним правильным ответом
   * @param {Event} e - событие отправки формы
   */
  const handleCreateSingleChoiceAnswers = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const answerTexts = formData.getAll('answerText').filter(text => text.trim());
    const correctAnswerIndex = parseInt(formData.get('correctAnswer') || '0');
    
    if (answerTexts.length < 2) {
      setFormError('Необходимо добавить минимум 2 варианта ответа');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    // Проверяем, есть ли уже правильные ответы для этого вопроса
    if (answers.length > 0 && answers.some(answer => answer.isCorrect)) {
      setFormError('Для вопроса с одним правильным ответом уже существует правильный ответ. Удалите существующие ответы или используйте добавление по одному.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Формируем правильный и неправильные ответы, как ожидает бэкенд
      const correctAnswerText = answerTexts[correctAnswerIndex];
      const incorrectAnswersText = answerTexts.filter((_, index) => index !== correctAnswerIndex);
      
      const requestData = {
        correctAnswerText: correctAnswerText,
        incorrectAnswersText: incorrectAnswersText
      };
      
      console.log(`Отправляем запрос на создание вариантов ответов для вопроса ${question.id}:`, requestData);
      
      const response = await axios.post(`${API.ANSWERS.SINGLE_CHOICE(question.id)}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Варианты ответов успешно созданы:', response.data);
      
      // Обновляем список вариантов ответов
      setAnswers(response.data);
      setActiveTab('single'); // Переключаемся на вкладку добавления по одному
      
      // Очищаем форму
      e.target.reset();
    } catch (error) {
      console.error('Ошибка при создании вариантов ответов:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать варианты ответов. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Создание набора вариантов ответов для вопроса с несколькими правильными ответами
   * @param {Event} e - событие отправки формы
   */
  const handleCreateMultipleChoiceAnswers = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const answerTexts = formData.getAll('answerText').filter(text => text.trim());
    const correctAnswerIndices = Array.from(formData.entries())
      .filter(([name, value]) => name.startsWith('correctAnswer') && value === 'on')
      .map(([name]) => parseInt(name.replace('correctAnswer', '')));
    
    if (answerTexts.length < 2) {
      setFormError('Необходимо добавить минимум 2 варианта ответа');
      return;
    }
    
    if (correctAnswerIndices.length === 0) {
      setFormError('Необходимо выбрать хотя бы один правильный ответ');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Разделяем ответы на правильные и неправильные, как ожидает бэкенд
      const correctAnswersText = [];
      const incorrectAnswersText = [];
      
      // Распределяем ответы по соответствующим массивам
      answerTexts.forEach((text, index) => {
        if (correctAnswerIndices.includes(index)) {
          correctAnswersText.push(text);
        } else {
          incorrectAnswersText.push(text);
        }
      });
      
      const requestData = {
        correctAnswersText: correctAnswersText,
        incorrectAnswersText: incorrectAnswersText
      };
      
      console.log(`Отправляем запрос на создание вариантов ответов для вопроса ${question.id}:`, requestData);
      
      const response = await axios.post(`${API.ANSWERS.MULTIPLE_CHOICE(question.id)}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Варианты ответов успешно созданы:', response.data);
      
      // Обновляем список вариантов ответов
      setAnswers(response.data);
      
      // Очищаем форму
      e.target.reset();
    } catch (error) {
      console.error('Ошибка при создании вариантов ответов:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать варианты ответов. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Переключение статуса правильности варианта ответа
   * @param {number} answerId - ID варианта ответа
   * @param {boolean} currentIsCorrect - текущий статус правильности
   */
  const toggleAnswerCorrectness = (answerId, currentIsCorrect) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    // Если пытаемся сделать ответ правильным
    if (!currentIsCorrect) {
      // Проверяем, что для вопросов с одним правильным ответом нет других правильных ответов
      if (questionData.type === 'SINGLE_CHOICE' && answers.some(a => a.isCorrect)) {
        setFormError('Для вопроса с одним правильным ответом может быть только один правильный вариант ответа. Сначала измените существующий правильный ответ на неправильный.');
        return;
      }
    }
    
    handleUpdateAnswer(answerId, {
      text: answer.text,
      isCorrect: !currentIsCorrect
    });
  };

  /**
   * Отображение информации о вопросе с возможностью редактирования
   * @returns {JSX.Element} - информация о вопросе
   */
  const renderQuestionInfo = () => (
    <div className="question-info">
      {editMode ? (
        <div className="question-edit-form">
          <div className="form-group">
            <label htmlFor="text">Текст вопроса*</label>
            <textarea
              id="text"
              name="text"
              value={questionData.text}
              onChange={handleQuestionInputChange}
              required
              rows={4}
            />
          </div>
          <div className="form-group">
            <label htmlFor="type">Тип вопроса</label>
            <select
              id="type"
              name="type"
              value={questionData.type}
              onChange={handleQuestionInputChange}
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
              value={questionData.points}
              onChange={handleQuestionInputChange}
              min={1}
              max={100}
            />
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="requiresManualCheck"
                checked={questionData.requiresManualCheck}
                onChange={handleQuestionInputChange}
              />
              Требуется ручная проверка
            </label>
          </div>
          <div className="form-actions">
            <button 
              className="primary-button" 
              onClick={handleUpdateQuestion}
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
        <div className="question-info-display">
          <div className="question-type-badge">
            {questionData.type === 'SINGLE_CHOICE' && 'Один правильный ответ'}
            {questionData.type === 'MULTIPLE_CHOICE' && 'Несколько правильных ответов'}
            {questionData.type === 'TEXT_INPUT' && 'Текстовый ввод'}
            {questionData.type === 'ESSAY' && 'Эссе'}
            {questionData.type === 'CODING' && 'Программирование'}
          </div>
          <h2 className="question-text-display">{questionData.text}</h2>
          <div className="question-meta-display">
            <div className="question-points-badge">
              {questionData.points} {questionData.points === 1 ? 'балл' : 
                (questionData.points >= 2 && questionData.points <= 4) ? 'балла' : 'баллов'}
            </div>
            {questionData.requiresManualCheck && (
              <div className="question-manual-check-badge">
                Требуется ручная проверка
              </div>
            )}
          </div>
          <button 
            className="edit-question-button" 
            onClick={() => setEditMode(true)}
          >
            Редактировать вопрос
          </button>
        </div>
      )}
    </div>
  );

  /**
   * Отображение формы создания варианта ответа
   * @returns {JSX.Element} - форма создания варианта ответа
   */
  const renderAnswerForm = () => (
    <div className="answer-form-container">
      <h3>Добавить вариант ответа</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleCreateAnswer} className="answer-form">
        <div className="form-group">
          <label htmlFor="text">Текст варианта ответа*</label>
          <input
            type="text"
            id="text"
            name="text"
            value={newAnswer.text}
            onChange={handleAnswerInputChange}
            required
            placeholder="Введите текст варианта ответа"
          />
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isCorrect"
              checked={newAnswer.isCorrect}
              onChange={handleAnswerInputChange}
            />
            Правильный ответ
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Добавление...' : 'Добавить вариант ответа'}
          </button>
        </div>
      </form>
    </div>
  );

  /**
   * Отображение формы создания набора вариантов ответов для вопроса с одним правильным ответом
   * @returns {JSX.Element} - форма создания набора вариантов ответов
   */
  const renderSingleChoiceAnswersForm = () => {
    // Не заполняем форму существующими ответами, чтобы избежать дублирования
    
    return (
      <div className="answer-form-container">
        <h3>Создать варианты ответов (один правильный)</h3>
        {formError && <div className="error-message">{formError}</div>}

        <form onSubmit={handleCreateSingleChoiceAnswers} className="answer-form">
          <div className="answer-options">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="answer-option">
                <div className="form-group">
                  <label htmlFor={`answerText${index}`}>Вариант {index + 1}</label>
                  <input
                    type="text"
                    id={`answerText${index}`}
                    name="answerText"
                    placeholder={`Введите текст варианта ${index + 1}`}
                    required={index < 2}
                  />
                </div>
                <div className="form-group radio-group">
                  <label>
                    <input
                      type="radio"
                      name="correctAnswer"
                      value={index}
                      defaultChecked={index === 0}
                    />
                    Правильный ответ
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Создание...' : 'Создать варианты ответов'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  /**
   * Отображение формы создания набора вариантов ответов для вопроса с несколькими правильными ответами
   * @returns {JSX.Element} - форма создания набора вариантов ответов
   */
  const renderMultipleChoiceAnswersForm = () => {
    // Не заполняем форму существующими ответами, чтобы избежать дублирования
    
    return (
      <div className="answer-form-container">
        <h3>Создать варианты ответов (несколько правильных)</h3>
        {formError && <div className="error-message">{formError}</div>}

        <form onSubmit={handleCreateMultipleChoiceAnswers} className="answer-form">
          <div className="answer-options">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="answer-option">
                <div className="form-group">
                  <label htmlFor={`answerText${index}`}>Вариант {index + 1}</label>
                  <input
                    type="text"
                    id={`answerText${index}`}
                    name="answerText"
                    placeholder={`Введите текст варианта ${index + 1}`}
                    required={index < 2}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name={`correctAnswer${index}`}
                      defaultChecked={false}
                    />
                    Правильный ответ
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Создание...' : 'Создать варианты ответов'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  /**
   * Отображение списка вариантов ответов
   * @returns {JSX.Element} - список вариантов ответов
   */
  const renderAnswersList = () => {
    if (loading && answers.length === 0) {
      return <div className="loading">Загрузка вариантов ответов...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (answers.length === 0) {
      return (
        <div className="no-answers">
          <p>У этого вопроса пока нет вариантов ответов.</p>
          {(questionData.type === 'SINGLE_CHOICE' || questionData.type === 'MULTIPLE_CHOICE') && (
            <p>Добавьте варианты ответов, используя форму ниже.</p>
          )}
        </div>
      );
    }
    
    return (
      <div className="answers-list">
        {answers.map((answer, index) => (
          <div 
            key={answer.id} 
            className={`answer-item ${answer.isCorrect ? 'correct-answer' : ''}`}
          >
            <div className="answer-number">{index + 1}</div>
            <div className="answer-text">{answer.text}</div>
            <div className="answer-actions">
              <button 
                className={`toggle-correct-button ${answer.isCorrect ? 'correct' : 'incorrect'}`}
                onClick={() => toggleAnswerCorrectness(answer.id, answer.isCorrect)}
                title={answer.isCorrect ? 'Отметить как неправильный' : 'Отметить как правильный'}
              >
                {answer.isCorrect ? '✓' : '✗'}
              </button>
              <button 
                className="icon-button delete-button" 
                onClick={() => handleDeleteAnswer(answer.id)}
                title="Удалить вариант ответа"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Отображение форм для создания вариантов ответов в зависимости от типа вопроса
   * @returns {JSX.Element} - формы для создания вариантов ответов
   */
  const [activeTab, setActiveTab] = useState('batch'); // 'batch' или 'single'
  
  // При переключении на вкладку добавления по одному загружаем существующие ответы
  useEffect(() => {
    if (activeTab === 'single' && question && question.id) {
      fetchAnswers(question.id);
    }
  }, [activeTab, question]);
  
  const renderAnswerForms = () => {
    if (questionData.type === 'SINGLE_CHOICE') {
      return (
        <div className="answer-forms-container">
          <div className="answer-forms-tabs">
            <button 
              className={`tab-button ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('batch');
                setFormError(null); // Сбрасываем сообщение об ошибке при переключении вкладки
              }}
              type="button"
            >
              Создать набор ответов
            </button>
            <button 
              className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('single');
                setFormError(null); // Сбрасываем сообщение об ошибке при переключении вкладки
              }}
              type="button"
            >
              Добавить по одному
            </button>
          </div>
          {activeTab === 'batch' ? renderSingleChoiceAnswersForm() : renderAnswerForm()}
        </div>
      );
    } else if (questionData.type === 'MULTIPLE_CHOICE') {
      return (
        <div className="answer-forms-container">
          <div className="answer-forms-tabs">
            <button 
              className={`tab-button ${activeTab === 'batch' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('batch');
                setFormError(null); // Сбрасываем сообщение об ошибке при переключении вкладки
              }}
              type="button"
            >
              Создать набор ответов
            </button>
            <button 
              className={`tab-button ${activeTab === 'single' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('single');
                setFormError(null); // Сбрасываем сообщение об ошибке при переключении вкладки
              }}
              type="button"
            >
              Добавить по одному
            </button>
          </div>
          {activeTab === 'batch' ? renderMultipleChoiceAnswersForm() : renderAnswerForm()}
        </div>
      );
    } else if (questionData.type === 'TEXT_INPUT') {
      return (
        <div className="text-input-help">
          <p>Для вопросов с текстовым вводом не требуется создавать варианты ответов.</p>
          <p>Студенты будут вводить свои ответы в текстовое поле, и вы сможете проверить их вручную.</p>
        </div>
      );
    } else if (questionData.type === 'ESSAY') {
      return (
        <div className="essay-help">
          <p>Для вопросов типа "Эссе" не требуется создавать варианты ответов.</p>
          <p>Студенты будут писать развернутые ответы, которые вы сможете проверить вручную.</p>
        </div>
      );
    } else if (questionData.type === 'CODING') {
      return (
        <div className="coding-help">
          <p>Для вопросов по программированию не требуется создавать варианты ответов.</p>
          <p>Студенты будут писать код, который вы сможете проверить вручную.</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="question-editor">
      <div className="question-editor-container">
        <div className="question-editor-header">
          <button className="back-button" onClick={onBack}>
            &larr; Назад к вопросам
          </button>
        </div>
        
        {renderQuestionInfo()}
        
        <div className="answers-section">
          <h3 className="answers-title">Варианты ответов</h3>
          {renderAnswersList()}
          {renderAnswerForms()}
        </div>
      </div>
    </div>
  );
}

export default QuestionEditor;
