import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './CourseEditor.css';

/**
 * Компонент для редактирования курса и добавления уроков
 * @returns {JSX.Element} - компонент редактирования курса
 */
function CourseEditor() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    order: 0
  });
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    isPublic: false
  });

  // Загрузка данных курса и уроков при монтировании компонента
  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  /**
   * Получение данных курса и уроков с сервера
   */
  const fetchCourseData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Получаем данные курса из локального хранилища
      try {
        // Проверяем, есть ли данные курса в локальном хранилище
        const cachedCourses = JSON.parse(localStorage.getItem('teacherCourses') || '[]');
        const cachedCourse = cachedCourses.find(course => course.id === parseInt(courseId));
        
        if (cachedCourse) {
          console.log('Используем кэшированные данные курса:', cachedCourse);
          setCourse(cachedCourse);
          setCourseForm({
            title: cachedCourse.title || '',
            description: cachedCourse.description || '',
            isPublic: cachedCourse.isPublic || false
          });
        }
      } catch (cacheError) {
        console.error('Ошибка при чтении кэша:', cacheError);
      }
      
      // Пытаемся получить актуальные данные с сервера
      try {
        console.log('Запрашиваем данные курса с ID:', courseId);
        const courseResponse = await axios.get(API.COURSES.BY_ID(courseId), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Получены данные курса:', courseResponse.data);
        setCourse(courseResponse.data);
        setCourseForm({
          title: courseResponse.data.title || '',
          description: courseResponse.data.description || '',
          isPublic: courseResponse.data.isPublic || false
        });
      } catch (courseError) {
        console.error('Ошибка при загрузке данных курса:', courseError);
        if (courseError.response) {
          console.error('Ответ сервера:', courseError.response.data);
        }
        
        // Если нет кэшированных данных, создаем временный объект
        if (!course) {
          console.log('Создаем временный объект курса');
          setCourse({
            id: parseInt(courseId),
            title: 'Новый курс',
            description: '',
            isPublic: false,
            status: 'DRAFT'
          });
          setCourseForm({
            title: 'Новый курс',
            description: '',
            isPublic: false
          });
        }
      }
      
      // Получаем уроки курса
      try {
        console.log('Запрашиваем уроки курса с ID:', courseId);
        const lessonsResponse = await axios.get(`${API.LESSONS.BY_COURSE_ID(courseId)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Получены уроки курса:', lessonsResponse.data);
        setLessons(lessonsResponse.data || []);
      } catch (lessonsError) {
        console.error('Ошибка при загрузке уроков:', lessonsError);
        if (lessonsError.response) {
          console.error('Ответ сервера:', lessonsError.response.data);
        }
        setLessons([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Общая ошибка при загрузке данных:', error);
      setError('Не удалось загрузить данные курса. Пожалуйста, попробуйте позже.');
      setLoading(false);
      
      // Если токен недействителен, перенаправляем на страницу входа
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  };

  /**
   * Обработка изменений в форме курса
   * @param {Event} e - событие изменения
   */
  const handleCourseFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCourseForm({
      ...courseForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  /**
   * Обработка отправки формы курса
   * @param {Event} e - событие отправки формы
   */
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Отправляем запрос на обновление курса:', courseForm);
      
      // Обновляем локальный кэш курсов
      try {
        const cachedCourses = JSON.parse(localStorage.getItem('teacherCourses') || '[]');
        const courseIndex = cachedCourses.findIndex(c => c.id === parseInt(courseId));
        
        if (courseIndex !== -1) {
          // Обновляем существующий курс
          cachedCourses[courseIndex] = {
            ...cachedCourses[courseIndex],
            title: courseForm.title,
            description: courseForm.description,
            isPublic: courseForm.isPublic
          };
        } else {
          // Добавляем новый курс
          cachedCourses.push({
            id: parseInt(courseId),
            title: courseForm.title,
            description: courseForm.description,
            isPublic: courseForm.isPublic,
            status: 'DRAFT'
          });
        }
        
        localStorage.setItem('teacherCourses', JSON.stringify(cachedCourses));
        console.log('Кэш курсов обновлен');
      } catch (cacheError) {
        console.error('Ошибка при обновлении кэша:', cacheError);
      }
      
      // Создаем объект с минимальными необходимыми полями
      const courseData = {
        title: courseForm.title,
        description: courseForm.description,
        isPublic: courseForm.isPublic
      };
      
      // Добавляем поля из текущего курса, если они есть
      if (course && course.status) {
        courseData.status = course.status;
      }
      
      // Обновляем данные курса в состоянии компонента
      setCourse({
        ...course,
        title: courseForm.title,
        description: courseForm.description,
        isPublic: courseForm.isPublic
      });
      
      // Пытаемся отправить данные на сервер
      try {
        const response = await axios.put(API.COURSES.BY_ID(courseId), courseData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Курс успешно обновлен на сервере:', response.data);
        setActiveTab('lessons');
      } catch (updateError) {
        console.error('Ошибка при обновлении курса на сервере:', updateError);
        
        if (updateError.response) {
          console.error('Ответ сервера:', updateError.response.data);
        }
        
        // Показываем уведомление, но не блокируем работу с курсом
        setError('Не удалось обновить курс на сервере, но изменения сохранены локально. Изменения будут синхронизированы при восстановлении соединения.');
        setActiveTab('lessons');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Общая ошибка при обновлении курса:', error);
      setError('Не удалось обновить курс. Пожалуйста, попробуйте позже.');
      setLoading(false);
    }
  };

  /**
   * Обработка изменений в форме урока
   * @param {Event} e - событие изменения
   */
  const handleLessonFormChange = (e) => {
    const { name, value } = e.target;
    setNewLesson({
      ...newLesson,
      [name]: value
    });
  };

  /**
   * Обработка отправки формы урока
   * @param {Event} e - событие отправки формы
   */
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Устанавливаем порядок урока
      const lessonToCreate = {
        ...newLesson,
        order: lessons.length + 1
      };
      
      await axios.post(`${API.LESSONS.BY_COURSE_ID(courseId)}`, lessonToCreate, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем список уроков
      const lessonsResponse = await axios.get(`${API.LESSONS.BY_COURSE_ID(courseId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setLessons(lessonsResponse.data);
      
      // Сбрасываем форму
      setNewLesson({
        title: '',
        description: '',
        content: '',
        order: 0
      });
      
      setShowAddLessonForm(false);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при создании урока:', error);
      setError('Не удалось создать урок. Пожалуйста, попробуйте позже.');
      setLoading(false);
    }
  };

  /**
   * Обработка удаления урока
   * @param {number} lessonId - ID урока
   */
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот урок?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await axios.delete(`${API.LESSONS.BY_ID(lessonId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Обновляем список уроков
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
    } catch (error) {
      console.error('Ошибка при удалении урока:', error);
      setError('Не удалось удалить урок. Пожалуйста, попробуйте позже.');
    }
  };

  /**
   * Обработка перехода к редактированию урока
   * @param {number} lessonId - ID урока
   */
  const handleEditLesson = (lessonId) => {
    navigate(`/lessons/${lessonId}/edit`);
  };

  /**
   * Отображение формы редактирования курса
   * @returns {JSX.Element} - форма редактирования курса
   */
  const renderCourseForm = () => {
    return (
      <div className="course-edit-form">
        <h3>Редактирование информации о курсе</h3>
        <form onSubmit={handleCourseSubmit}>
          <div className="form-group">
            <label htmlFor="title">Название курса</label>
            <input
              type="text"
              id="title"
              name="title"
              value={courseForm.title}
              onChange={handleCourseFormChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Описание курса</label>
            <textarea
              id="description"
              name="description"
              value={courseForm.description}
              onChange={handleCourseFormChange}
              rows="4"
              required
            ></textarea>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="isPublic"
                checked={courseForm.isPublic}
                onChange={handleCourseFormChange}
              />
              Публичный курс
            </label>
            <small>Публичные курсы видны всем пользователям</small>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={() => navigate('/profile')}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    );
  };

  /**
   * Отображение списка уроков
   * @returns {JSX.Element} - список уроков
   */
  const renderLessonsList = () => {
    if (lessons.length === 0 && !showAddLessonForm) {
      return (
        <div className="empty-lessons">
          <div className="book-animation">
            <div className="book">
              <div className="book-cover">📝</div>
              <div className="book-page"></div>
              <div className="book-page"></div>
              <div className="book-page"></div>
            </div>
          </div>
          <h3>В этом курсе пока нет уроков</h3>
          <p>Добавьте первый урок, чтобы начать наполнять курс материалами</p>
          <button 
            className="create-lesson-button" 
            onClick={() => setShowAddLessonForm(true)}
          >
            Добавить урок
          </button>
        </div>
      );
    }
    
    return (
      <div className="lessons-container">
        <div className="lessons-header">
          <h3>Уроки курса</h3>
          {!showAddLessonForm && (
            <button 
              className="add-lesson-button" 
              onClick={() => setShowAddLessonForm(true)}
            >
              Добавить урок
            </button>
          )}
        </div>
        
        {showAddLessonForm && (
          <div className="lesson-form-container">
            <h4>Добавление нового урока</h4>
            <form onSubmit={handleLessonSubmit}>
              <div className="form-group">
                <label htmlFor="lessonTitle">Название урока</label>
                <input
                  type="text"
                  id="lessonTitle"
                  name="title"
                  value={newLesson.title}
                  onChange={handleLessonFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lessonDescription">Краткое описание</label>
                <textarea
                  id="lessonDescription"
                  name="description"
                  value={newLesson.description}
                  onChange={handleLessonFormChange}
                  rows="2"
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="lessonContent">Содержание урока</label>
                <textarea
                  id="lessonContent"
                  name="content"
                  value={newLesson.content}
                  onChange={handleLessonFormChange}
                  rows="6"
                  required
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? 'Добавление...' : 'Добавить урок'}
                </button>
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => setShowAddLessonForm(false)}
                  disabled={loading}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}
        
        {lessons.length > 0 && (
          <div className="lessons-list">
            {lessons.map((lesson, index) => (
              <div className="lesson-card" key={lesson.id}>
                <div className="lesson-number">{index + 1}</div>
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  <p>{lesson.description}</p>
                </div>
                <div className="lesson-actions">
                  <button 
                    className="edit-lesson-button" 
                    onClick={() => handleEditLesson(lesson.id)}
                  >
                    Редактировать
                  </button>
                  <button 
                    className="delete-lesson-button" 
                    onClick={() => handleDeleteLesson(lesson.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Отображение загрузки
  if (loading && !course) {
    return (
      <div className="course-editor-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка данных курса...</p>
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error && !course) {
    return (
      <div className="course-editor-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => navigate('/profile')} className="primary-button">
            Вернуться в профиль
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-editor-container">
      <div className="course-editor-header">
        <h2>Редактирование курса: {course?.title}</h2>
        <button className="back-button" onClick={() => navigate('/profile')}>
          ← Вернуться к списку курсов
        </button>
      </div>
      
      <div className="editor-tabs">
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Информация о курсе
        </button>
        <button 
          className={`tab-button ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          Уроки
        </button>
      </div>
      
      <div className="editor-content">
        {activeTab === 'info' ? renderCourseForm() : renderLessonsList()}
      </div>
    </div>
  );
}

export default CourseEditor;
