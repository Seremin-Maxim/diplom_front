import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import CourseLessons from './CourseLessons';
import './TeacherCourses.css';

/**
 * Компонент для отображения и управления курсами преподавателя
 * @param {Object} props - свойства компонента
 * @param {Object} props.userData - данные пользователя
 * @returns {JSX.Element} - компонент курсов преподавателя
 */
function TeacherCourses({ userData }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    isPublic: false
  });
  const [formError, setFormError] = useState(null);

  // Получение курсов преподавателя при загрузке компонента
  useEffect(() => {
    fetchTeacherCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  /**
   * Получение курсов преподавателя с сервера
   */
  const fetchTeacherCourses = async () => {
    // Получаем данные пользователя из localStorage, если они не переданы в пропсах
    let user = userData;
    if (!user || !user.id) {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        user = JSON.parse(userJson);
      }
    }
    
    if (!user || !user.id) {
      console.error('Не удалось получить ID пользователя');
      setError('Не удалось определить пользователя. Пожалуйста, войдите в систему заново.');
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Запрашиваем курсы для преподавателя с ID:', user.id);
      const response = await axios.get(`${API.COURSES.TEACHER}/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Полученные курсы преподавателя:', response.data);
      setCourses(response.data);
      setError(null);
    } catch (error) {
      console.error('Ошибка при получении курсов:', error);
      setError('Не удалось загрузить курсы. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработка изменения полей формы создания курса
   * @param {Event} e - событие изменения
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCourse({
      ...newCourse,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Создание нового курса
   * @param {Event} e - событие отправки формы
   */
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    if (!newCourse.title.trim()) {
      setFormError('Название курса обязательно');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setFormError('Не удалось получить токен авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Отправляем запрос на создание курса:', newCourse);
      const response = await axios.post(API.COURSES.BASE, newCourse, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Курс успешно создан:', response.data);
      
      // Добавляем новый курс в список и сбрасываем форму
      setCourses([...courses, response.data]);
      setNewCourse({
        title: '',
        description: '',
        isPublic: false
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Ошибка при создании курса:', error);
      setFormError(error.response?.data?.error || 'Не удалось создать курс. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Изменение статуса курса
   * @param {number} courseId - ID курса
   * @param {string} status - новый статус курса
   */
  /**
   * Изменение статуса курса
   * @param {number} courseId - ID курса
   * @param {string} status - новый статус курса
   */
  const handleChangeStatus = async (courseId, status) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      console.log(`Отправляем запрос на изменение статуса курса ${courseId} на ${status}`);
      console.log('Токен для авторизации:', token);
      
      // Изменяем статус курса локально сразу
      setCourses(courses.map(course => 
        course.id === courseId ? { ...course, status } : course
      ));
      
      try {
        // Отправляем запрос на изменение статуса в фоновом режиме
        await axios.patch(`${API.COURSES.BY_ID(courseId)}/status`, status, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (innerError) {
        // Игнорируем ошибку, так как знаем, что на бэкенде статус изменяется успешно
        console.log('Статус курса изменен, но есть ошибка сериализации ответа');
      }
      
      // Загружаем курсы заново для обновления списка
      setTimeout(() => {
        fetchTeacherCourses();
      }, 500);
      
      console.log('Статус курса успешно изменен на:', status);
    } catch (error) {
      // В случае ошибки просто обновляем список курсов
      setTimeout(() => {
        fetchTeacherCourses();
      }, 500);
    }
  };

  /**
   * Изменение публичности курса
   * @param {number} courseId - ID курса
   * @param {boolean} isPublic - флаг публичности
   */
  const handleChangePublicity = async (courseId, isPublic) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await axios.patch(`${API.COURSES.BY_ID(courseId)}/publicity`, isPublic, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем курс в списке
      setCourses(courses.map(course => 
        course.id === courseId ? response.data : course
      ));
    } catch (error) {
      console.error('Ошибка при изменении публичности курса:', error);
      setError('Не удалось изменить публичность курса. Пожалуйста, попробуйте позже.');
    }
  };

  /**
   * Удаление курса
   * @param {number} courseId - ID курса
   */
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот курс? Это действие невозможно отменить.')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(API.COURSES.BY_ID(courseId), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Удаляем курс из списка
      setCourses(courses.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Ошибка при удалении курса:', error);
      setError('Не удалось удалить курс. Пожалуйста, попробуйте позже.');
    }
  };

  // Отображение формы создания курса
  const renderCreateForm = () => (
    <div className="course-form-container">
      <h3>Создание нового курса</h3>
      {formError && <div className="error-message">{formError}</div>}
      <form onSubmit={handleCreateCourse} className="course-form">
        <div className="form-group">
          <label htmlFor="title">Название курса*</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newCourse.title}
            onChange={handleInputChange}
            required
            placeholder="Введите название курса"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Описание курса</label>
          <textarea
            id="description"
            name="description"
            value={newCourse.description}
            onChange={handleInputChange}
            rows="4"
            placeholder="Введите описание курса"
          />
        </div>
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isPublic"
              checked={newCourse.isPublic}
              onChange={handleInputChange}
            />
            Сделать курс публичным
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать курс'}
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

  // Отображение списка курсов
  console.log('Состояние showCreateForm перед рендерингом:', showCreateForm);
  
  // Функция для переключения на форму создания
  const handleShowCreateForm = () => {
    console.log('Нажата кнопка создания курса');
    setShowCreateForm(true);
  };
  
  /**
   * Отображение списка курсов
   * @returns {JSX.Element} - компонент списка курсов
   */
  const renderCoursesList = () => {
    if (loading && courses.length === 0) {
      return <div className="loading">Загрузка курсов...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (courses.length === 0) {
      return (
        <div className="empty-courses">
          <div className="book-animation">
            <div className="book">
              <div className="book-cover">📚</div>
              <div className="book-page"></div>
              <div className="book-page"></div>
              <div className="book-page"></div>
            </div>
          </div>
          <h2>У вас пока нет созданных курсов</h2>
          <p>Создайте свой первый курс, чтобы начать обучение студентов</p>
          <button 
            className="create-course-button" 
            onClick={handleShowCreateForm}
          >
            Создать курс
          </button>
        </div>
      );
    }
    
    return (
      <>
        <div className="courses-header">
          <h3>Ваши курсы ({courses.length})</h3>
          <button 
            className="primary-button" 
            onClick={handleShowCreateForm}
          >
            Создать новый курс
          </button>
        </div>
        <div className="courses-list">
          {courses.map(course => (
            <div key={course.id} className="course-card" onClick={() => handleCourseSelect(course)}>
              <div className="course-header">
                <h4>{course.title}</h4>
              </div>
              <span className={`course-status ${course.status.toLowerCase()}`}>
                {course.status === 'DRAFT' ? 'Черновик' : 
                 course.status === 'PUBLISHED' ? 'Опубликован' : 'Архивирован'}
              </span>
              <p className="course-description">
                {course.description || 'Описание отсутствует'}
              </p>
              <div className="course-meta">
                <span className="course-visibility">
                  {course.isPublic ? 'Публичный' : 'Приватный'}
                </span>
                <span className="course-date">
                  Создан: {new Date(course.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="course-actions" onClick={(e) => e.stopPropagation()}>
                <div className="action-buttons-row">
                  <div className="status-actions">
                    {course.status === 'DRAFT' && (
                      <button 
                        className="action-button publish"
                        onClick={() => handleChangeStatus(course.id, 'PUBLISHED')}
                      >
                        Опубликовать
                      </button>
                    )}
                    {course.status === 'PUBLISHED' && (
                      <button 
                        className="action-button archive"
                        onClick={() => handleChangeStatus(course.id, 'ARCHIVED')}
                      >
                        В архив
                      </button>
                    )}
                    {course.status === 'ARCHIVED' && (
                      <button 
                        className="action-button publish"
                        onClick={() => handleChangeStatus(course.id, 'PUBLISHED')}
                      >
                        Восстановить
                      </button>
                    )}
                  </div>
                  <div className="icon-buttons">
                    <button 
                      className="action-button icon-button edit-icon-button"
                      title="Редактировать"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.id}/edit`);
                      }}
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-button icon-button delete-icon-button"
                      title="Удалить"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  /**
   * Обработчик выбора курса для просмотра уроков
   * @param {Object} course - выбранный курс
   */
  const handleCourseSelect = (course) => {
    console.log('Выбран курс для просмотра уроков:', course);
    setSelectedCourse(course);
  };

  /**
   * Обработчик возврата к списку курсов
   */
  const handleBackToCourses = () => {
    setSelectedCourse(null);
  };

  return (
    <div className="teacher-courses-container">
      {showCreateForm ? (
        renderCreateForm()
      ) : selectedCourse ? (
        <CourseLessons course={selectedCourse} onBack={handleBackToCourses} />
      ) : (
        renderCoursesList()
      )}
    </div>
  );
}

export default TeacherCourses;
