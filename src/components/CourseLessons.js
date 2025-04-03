import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import LessonTests from './LessonTests';
import './CourseLessons.css';

/**
 * Компонент для отображения уроков курса
 * @param {Object} props - свойства компонента
 * @param {Object} props.course - данные о курсе
 * @param {Function} props.onBack - функция для возврата к списку курсов
 * @returns {JSX.Element} - компонент уроков курса
 */
function CourseLessons({ course, onBack }) {
  /**
   * Функция для обрезания текста до указанного количества символов
   * @param {string} text - исходный текст
   * @param {number} maxLength - максимальная длина текста
   * @returns {string} - обрезанный текст
   */
  const truncateContent = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };
  
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showTests, setShowTests] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    content: '',
    order: null
  });
  const [editingLesson, setEditingLesson] = useState({
    id: null,
    title: '',
    content: '',
    order: null
  });
  const [formError, setFormError] = useState(null);

  // Получение уроков курса при загрузке компонента
  useEffect(() => {
    if (course && course.id) {
      fetchLessons(course.id);
    }
  }, [course]);

  /**
   * Получение уроков курса с сервера
   * @param {number} courseId - ID курса
   */
  const fetchLessons = async (courseId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Запрашиваем уроки для курса с ID: ${courseId}`);
      
      const response = await axios.get(`${API.LESSONS.BY_COURSE_ID(courseId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Полученные уроки курса:', response.data);
      setLessons(response.data);
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении уроков:', error);
      setError('Не удалось загрузить уроки. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработка изменения полей формы создания урока
   * @param {Event} e - событие изменения
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLesson({
      ...newLesson,
      [name]: value
    });
  };

  /**
   * Создание нового урока
   * @param {Event} e - событие отправки формы
   */
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!newLesson.title.trim()) {
      setFormError('Название урока обязательно');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Отправляем запрос на создание урока для курса ${course.id}:`, newLesson);
      
      const response = await axios.post(`${API.LESSONS.BY_COURSE_ID(course.id)}`, newLesson, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Урок успешно создан:', response.data);
      
      // Добавляем новый урок в список и сортируем по порядковому номеру
      const updatedLessons = [...lessons, response.data].sort((a, b) => {
        // Если оба урока имеют порядковый номер, сортируем по нему
        if (a.order !== null && b.order !== null) {
          return a.order - b.order;
        }
        // Если только один урок имеет порядковый номер, он идет первым
        if (a.order !== null) return -1;
        if (b.order !== null) return 1;
        // Если ни один не имеет порядкового номера, сортируем по дате создания
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setLessons(updatedLessons);
      setNewLesson({
        title: '',
        content: '',
        description: '',
        order: null
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка при создании урока:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать урок. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Удаление урока
   * @param {number} lessonId - ID урока
   */
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот урок? Это действие невозможно отменить.')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API.LESSONS.BY_ID(lessonId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Удаляем урок из списка
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      console.error('Ошибка при удалении урока:', error);
      setError('Не удалось удалить урок. Пожалуйста, попробуйте позже.');
    }
  };
  
  /**
   * Начало редактирования урока
   * @param {Object} lesson - данные урока
   */
  const handleStartEditLesson = (lesson) => {
    setEditingLesson({
      id: lesson.id,
      title: lesson.title,
      content: lesson.content || '',
      order: lesson.order
    });
    setShowEditForm(true);
    setFormError(null);
  };
  
  /**
   * Обработка изменения полей формы редактирования урока
   * @param {Event} e - событие изменения
   */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingLesson({
      ...editingLesson,
      [name]: value
    });
  };
  
  /**
   * Обновление урока
   * @param {Event} e - событие отправки формы
   */
  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!editingLesson.title.trim()) {
      setFormError('Название урока обязательно');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      // Создаем объект для отправки, исключая поля с undefined
      const lessonToUpdate = {
        id: editingLesson.id,
        title: editingLesson.title,
        content: editingLesson.content || ''
      };
      
      console.log(`Отправляем запрос на обновление урока ${editingLesson.id}:`, lessonToUpdate);
      
      const response = await axios.put(`${API.LESSONS.BY_ID(editingLesson.id)}`, lessonToUpdate, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Урок успешно обновлен:', response.data);
      
      // Обновляем урок в списке
      setLessons(lessons.map(lesson => 
        lesson.id === editingLesson.id ? response.data : lesson
      ));
      
      setShowEditForm(false);
    } catch (error) {
      console.error('Ошибка при обновлении урока:', error);
      setFormError(error.response?.data?.error || 'Не удалось обновить урок. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Отображение формы редактирования урока
   * @returns {JSX.Element} - форма редактирования урока
   */
  const renderEditForm = () => (
    <div className="lesson-form-container">
      <h3>Редактирование урока</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleUpdateLesson} className="lesson-form">
        <div className="form-group">
          <label htmlFor="edit-title">Название урока*</label>
          <input
            type="text"
            id="edit-title"
            name="title"
            value={editingLesson.title}
            onChange={handleEditInputChange}
            required
            placeholder="Введите название урока"
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-content">Содержание урока</label>
          <textarea
            id="edit-content"
            name="content"
            value={editingLesson.content}
            onChange={handleEditInputChange}
            placeholder="Введите содержание урока"
            rows="5"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button 
            type="button" 
            className="secondary-button" 
            onClick={() => setShowEditForm(false)}
            disabled={loading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );

  /**
   * Отображение формы создания урока
   * @returns {JSX.Element} - форма создания урока
   */
  const renderCreateForm = () => (
    <div className="lesson-form-container">
      <h3>Создание нового урока</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleCreateLesson} className="lesson-form">
        <div className="form-group">
          <label htmlFor="title">Название урока*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newLesson.title}
            onChange={handleInputChange}
            required
            placeholder="Введите название урока"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Содержание урока</label>
          <textarea
            id="content"
            name="content"
            value={newLesson.content}
            onChange={handleInputChange}
            rows="6"
            placeholder="Введите содержание урока"
          />
        </div>
        <div className="form-group">
          <label htmlFor="order">Порядковый номер (необязательно)</label>
          <input
            type="number"
            id="order"
            name="order"
            value={newLesson.order || ''}
            onChange={handleInputChange}
            placeholder="Оставьте пустым для автоматического назначения"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать урок'}
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
   * Отображение списка уроков
   * @returns {JSX.Element} - компонент списка уроков
   */
  const renderLessonsList = () => {
    if (loading && lessons.length === 0) {
      return <div className="loading">Загрузка уроков...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    return (
      <div className="lessons-container">
        <div className="lessons-header">
          <button className="back-button" onClick={onBack}>
            &larr; Назад к курсам
          </button>
          <h2>{course.title} - Уроки</h2>
        </div>
        
        <div className="lessons-grid">
          {/* Карточка для создания нового урока */}
          <div className="lesson-card add-lesson-card" onClick={() => setShowCreateForm(true)}>
            <div className="add-lesson-icon">
              <span>+</span>
            </div>
            <p>Добавить новый урок</p>
          </div>
          
          {/* Список существующих уроков, отсортированных по порядковому номеру */}
          {lessons
            .slice()
            .sort((a, b) => {
              if (a.order !== null && b.order !== null) {
                return a.order - b.order;
              }
              if (a.order !== null) return -1;
              if (b.order !== null) return 1;
              return new Date(b.createdAt) - new Date(a.createdAt);
            })
            .map(lesson => (
              <div key={lesson.id} className="lesson-card">
                {lesson.order !== null && (
                  <div className="lesson-order-badge">Урок {lesson.order}</div>
                )}
                <div className="lesson-title" onClick={() => console.log(`Переход к уроку ${lesson.id}`)}>
                  {/* Заголовок урока */}
                  {lesson.title}
                </div>
                <div className="lesson-description">
                  {truncateContent(lesson.content, 50)}
                </div>
                <div className="lesson-actions">
                  <button 
                    className="icon-button tests-button" 
                    title="Тесты урока"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLesson(lesson);
                      setShowTests(true);
                    }}
                  >
                    📝
                  </button>
                  <button 
                    className="icon-button edit-button" 
                    title="Редактировать урок"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEditLesson(lesson);
                    }}
                  >
                    ✏️
                  </button>
                  <button 
                    className="icon-button delete-button" 
                    title="Удалить урок"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLesson(lesson.id);
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

  /**
   * Обработчик возврата из компонента тестов к списку уроков
   */
  const handleBackFromTests = () => {
    setShowTests(false);
    setSelectedLesson(null);
  };

  return (
    <div className="course-lessons">
      {showCreateForm ? (
        renderCreateForm()
      ) : showEditForm ? (
        renderEditForm()
      ) : showTests && selectedLesson ? (
        <LessonTests lesson={selectedLesson} onBack={handleBackFromTests} />
      ) : (
        renderLessonsList()
      )}
    </div>
  );
}

export default CourseLessons;
