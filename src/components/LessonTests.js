import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import TestEditor from './TestEditor';
import './LessonTests.css';

/**
 * Компонент для отображения тестов урока
 * @param {Object} props - свойства компонента
 * @param {Object} props.lesson - данные о уроке
 * @param {Function} props.onBack - функция для возврата к списку уроков
 * @returns {JSX.Element} - компонент тестов урока
 */
function LessonTests({ lesson, onBack }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [newTest, setNewTest] = useState({
    title: '',
    type: 'SINGLE_CHOICE',
    requiresManualCheck: false
  });
  const [formError, setFormError] = useState(null);

  // Получение тестов урока при загрузке компонента
  useEffect(() => {
    if (lesson && lesson.id) {
      fetchTests(lesson.id);
    }
  }, [lesson]);

  /**
   * Получение тестов урока с сервера
   * @param {number} lessonId - ID урока
   */
  const fetchTests = async (lessonId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Запрашиваем тесты для урока с ID: ${lessonId}`);
      
      const response = await axios.get(`${API.TESTS.BY_LESSON_ID(lessonId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Полученные тесты урока:', response.data);
      setTests(response.data);
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении тестов:', error);
      setError('Не удалось загрузить тесты. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработка изменения полей формы создания теста
   * @param {Event} e - событие изменения
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewTest({
      ...newTest,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Создание нового теста
   * @param {Event} e - событие отправки формы
   */
  const handleCreateTest = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!newTest.title.trim()) {
      setFormError('Название теста обязательно');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Отправляем запрос на создание теста для урока ${lesson.id}:`, newTest);
      
      const response = await axios.post(`${API.TESTS.BY_LESSON_ID(lesson.id)}`, newTest, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Тест успешно создан:', response.data);
      
      // Добавляем новый тест в список и сбрасываем форму
      setTests([...tests, response.data]);
      setNewTest({
        title: '',
        type: 'SINGLE_CHOICE',
        requiresManualCheck: false
      });
      setShowCreateForm(false);
      
      // Выбираем созданный тест для редактирования
      setSelectedTest(response.data);
    } catch (error) {
      console.error('Ошибка при создании теста:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать тест. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаление теста
   * @param {number} testId - ID теста
   */
  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот тест? Это действие невозможно отменить.')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API.TESTS.BY_ID(testId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Удаляем тест из списка
      setTests(tests.filter(test => test.id !== testId));
      
      // Если удаляемый тест был выбран, сбрасываем выбор
      if (selectedTest && selectedTest.id === testId) {
        setSelectedTest(null);
      }
    } catch (error) {
      console.error('Ошибка при удалении теста:', error);
      setError('Не удалось удалить тест. Пожалуйста, попробуйте позже.');
    }
  };

  /**
   * Обработчик выбора теста для редактирования
   * @param {Object} test - выбранный тест
   */
  const handleTestSelect = (test) => {
    setSelectedTest(test);
  };

  /**
   * Обработчик возврата к списку тестов
   */
  const handleBackToTests = () => {
    setSelectedTest(null);
    // Обновляем список тестов после редактирования
    fetchTests(lesson.id);
  };

  /**
   * Отображение формы создания теста
   * @returns {JSX.Element} - форма создания теста
   */
  const renderCreateForm = () => (
    <div className="test-form-container">
      <h3>Создание нового теста</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleCreateTest} className="test-form">
        <div className="form-group">
          <label htmlFor="title">Название теста*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newTest.title}
            onChange={handleInputChange}
            required
            placeholder="Введите название теста"
          />
        </div>
        <div className="form-group">
          <label htmlFor="type">Тип теста</label>
          <select
            id="type"
            name="type"
            value={newTest.type}
            onChange={handleInputChange}
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
              checked={newTest.requiresManualCheck}
              onChange={handleInputChange}
            />
            Требуется ручная проверка
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать тест'}
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
   * Отображение списка тестов
   * @returns {JSX.Element} - компонент списка тестов
   */
  const renderTestsList = () => {
    if (loading && tests.length === 0) {
      return <div className="loading">Загрузка тестов...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    return (
      <div className="tests-container">
        <div className="tests-header">
          <button className="back-button" onClick={onBack}>
            &larr; Назад к урокам
          </button>
          <h2>{lesson.title} - Тесты</h2>
        </div>
        
        <div className="tests-grid">
          {/* Карточка для создания нового теста */}
          <div className="test-card add-test-card" onClick={() => setShowCreateForm(true)}>
            <div className="add-test-icon">
              <span>+</span>
            </div>
            <p>Добавить новый тест</p>
          </div>
          
          {/* Список существующих тестов */}
          {tests.map(test => (
            <div key={test.id} className="test-card" onClick={() => handleTestSelect(test)}>
              <div className="test-title">
                {test.title}
              </div>
              <div className="test-type">
                {test.type === 'SINGLE_CHOICE' && 'Один правильный ответ'}
                {test.type === 'MULTIPLE_CHOICE' && 'Несколько правильных ответов'}
                {test.type === 'TEXT_INPUT' && 'Текстовый ввод'}
                {test.type === 'ESSAY' && 'Эссе'}
                {test.type === 'CODING' && 'Программирование'}
              </div>
              {test.requiresManualCheck && (
                <div className="test-manual-check">
                  Требуется ручная проверка
                </div>
              )}
              <div className="test-actions" onClick={(e) => e.stopPropagation()}>
                <button 
                  className="icon-button edit-button" 
                  title="Редактировать тест"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestSelect(test);
                  }}
                >
                  ✏️
                </button>
                <button 
                  className="icon-button delete-button" 
                  title="Удалить тест"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTest(test.id);
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
    <div className="lesson-tests">
      {showCreateForm ? (
        renderCreateForm()
      ) : selectedTest ? (
        <TestEditor test={selectedTest} onBack={handleBackToTests} />
      ) : (
        renderTestsList()
      )}
    </div>
  );
}

export default LessonTests;
