import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../config/api';
import LessonTests from './LessonTests';
import './CourseLessons.css';

// Импорт Editor.js и его плагинов
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Code from '@editorjs/code';
import Paragraph from '@editorjs/paragraph';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';
import Delimiter from '@editorjs/delimiter';
import Quote from '@editorjs/quote';

// Определяем заглушки для дополнительных плагинов, которые будем использовать
// Это позволит нам добавить функциональность без установки пакетов
// и сохранить обратную совместимость

// Плагин для таблиц
const Table = {
  render: ({ data }) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('lesson-editor-table-wrapper');
    
    const table = document.createElement('table');
    table.classList.add('lesson-editor-table');
    
    if (data.withHeadings && data.content && data.content.length > 0) {
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      data.content[0].forEach(cell => {
        const th = document.createElement('th');
        th.innerHTML = cell || '';
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
    }
    
    const tbody = document.createElement('tbody');
    
    if (data.content) {
      const startRow = data.withHeadings ? 1 : 0;
      
      for (let i = startRow; i < data.content.length; i++) {
        const row = document.createElement('tr');
        
        data.content[i].forEach(cell => {
          const td = document.createElement('td');
          td.innerHTML = cell || '';
          row.appendChild(td);
        });
        
        tbody.appendChild(row);
      }
    }
    
    table.appendChild(tbody);
    wrapper.appendChild(table);
    
    return wrapper;
  },
  
  save: (blockContent) => {
    const table = blockContent.querySelector('table');
    const data = {
      withHeadings: !!table.querySelector('thead'),
      content: []
    };
    
    // Получаем заголовки, если они есть
    const thead = table.querySelector('thead');
    if (thead) {
      const headerCells = Array.from(thead.querySelectorAll('th')).map(th => th.innerHTML);
      data.content.push(headerCells);
    }
    
    // Получаем строки таблицы
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const rowData = Array.from(row.querySelectorAll('td')).map(td => td.innerHTML);
      data.content.push(rowData);
    });
    
    return data;
  },
  
  create: () => {
    return {
      withHeadings: true,
      content: [
        ['Заголовок 1', 'Заголовок 2', 'Заголовок 3'],
        ['Ячейка 1-1', 'Ячейка 1-2', 'Ячейка 1-3'],
        ['Ячейка 2-1', 'Ячейка 2-2', 'Ячейка 2-3']
      ]
    };
  }
};

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
  
  /**
   * Преобразование JSON-контента в текст для предпросмотра
   * @param {string} jsonContent - JSON-строка с контентом
   * @returns {string} - текст для предпросмотра
   */
  const getContentPreview = (jsonContent) => {
    if (!jsonContent) return '';
    
    try {
      const content = JSON.parse(jsonContent);
      if (!content.blocks || content.blocks.length === 0) return '';
      
      // Собираем текст из всех блоков
      let plainText = '';
      content.blocks.forEach(block => {
        if (block.type === 'paragraph') {
          plainText += block.data.text + ' ';
        } else if (block.type === 'header') {
          plainText += block.data.text + ' ';
        } else if (block.type === 'list') {
          block.data.items.forEach(item => {
            plainText += '• ' + item + ' ';
          });
        } else if (block.type === 'code') {
          plainText += '[Код] ';
        } else if (block.type === 'quote') {
          plainText += '"' + block.data.text + '" ';
        }
      });
      
      return truncateContent(plainText.trim(), 150);
    } catch (err) {
      // Если не удалось распарсить JSON, возвращаем исходный текст
      return truncateContent(jsonContent, 150);
    }
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
  
  // Ссылки на редакторы
  const createEditorRef = useRef(null);
  const editEditorRef = useRef(null);
  
  // Инициализация редактора для создания урока
  useEffect(() => {
    if (showCreateForm && !createEditorRef.current) {
      initCreateEditor();
    }
    
    return () => {
      if (createEditorRef.current) {
        createEditorRef.current.destroy();
        createEditorRef.current = null;
      }
    };
  }, [showCreateForm]);
  
  // Инициализация редактора для редактирования урока
  useEffect(() => {
    if (showEditForm && !editEditorRef.current) {
      initEditEditor();
    }
    
    return () => {
      if (editEditorRef.current) {
        editEditorRef.current.destroy();
        editEditorRef.current = null;
      }
    };
  }, [showEditForm]);
  
  /**
   * Инициализация редактора для создания урока
   */
  const initCreateEditor = () => {
    try {
      // Проверяем, существует ли элемент для редактора
      const editorElement = document.getElementById('create-editor');
      if (!editorElement) return;
      
      // Создаем экземпляр редактора
      createEditorRef.current = new EditorJS({
        holder: 'create-editor',
        placeholder: 'Начните вводить содержание урока...',
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          checklist: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'checklist'
            }
          },
          code: {
            class: Code,
            config: {
              placeholder: 'Вставьте код'
            }
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true
          },
          marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M'
          },
          inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+C'
          },
          delimiter: Delimiter,
          quote: {
            class: Quote,
            inlineToolbar: true
          },
          table: {
            class: Table,
            inlineToolbar: true,
            config: {
              rows: 2,
              cols: 3,
              withHeadings: true
            }
          }
        },
        data: {
          blocks: []
        },
        onChange: async () => {
          try {
            const savedData = await createEditorRef.current.save();
            setNewLesson({
              ...newLesson,
              content: JSON.stringify(savedData)
            });
          } catch (err) {
            console.error('Ошибка при сохранении данных редактора:', err);
          }
        }
      });
    } catch (err) {
      console.error('Ошибка при инициализации редактора:', err);
    }
  };
  
  /**
   * Инициализация редактора для редактирования урока
   */
  const initEditEditor = () => {
    try {
      // Проверяем, существует ли элемент для редактора
      const editorElement = document.getElementById('edit-editor');
      if (!editorElement) return;
      
      // Пытаемся распарсить существующий контент
      let initialData = { blocks: [] };
      if (editingLesson.content) {
        try {
          initialData = JSON.parse(editingLesson.content);
        } catch (err) {
          // Если контент не является JSON, создаем блок параграфа с этим текстом
          initialData = {
            blocks: [
              {
                type: 'paragraph',
                data: {
                  text: editingLesson.content
                }
              }
            ]
          };
        }
      }
      
      // Создаем экземпляр редактора
      editEditorRef.current = new EditorJS({
        holder: 'edit-editor',
        placeholder: 'Начните вводить содержание урока...',
        tools: {
          header: {
            class: Header,
            inlineToolbar: true,
            config: {
              levels: [1, 2, 3, 4, 5, 6],
              defaultLevel: 2
            }
          },
          list: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          checklist: {
            class: List,
            inlineToolbar: true,
            config: {
              defaultStyle: 'checklist'
            }
          },
          code: {
            class: Code,
            config: {
              placeholder: 'Вставьте код'
            }
          },
          paragraph: {
            class: Paragraph,
            inlineToolbar: true
          },
          marker: {
            class: Marker,
            shortcut: 'CMD+SHIFT+M'
          },
          inlineCode: {
            class: InlineCode,
            shortcut: 'CMD+SHIFT+C'
          },
          delimiter: Delimiter,
          quote: {
            class: Quote,
            inlineToolbar: true
          }
        },
        data: initialData,
        onChange: async () => {
          try {
            const savedData = await editEditorRef.current.save();
            setEditingLesson({
              ...editingLesson,
              content: JSON.stringify(savedData)
            });
          } catch (err) {
            console.error('Ошибка при сохранении данных редактора:', err);
          }
        }
      });
    } catch (err) {
      console.error('Ошибка при инициализации редактора:', err);
    }
  };

  /**
   * Получение уроков курса при загрузке компонента
   */
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
      
      // Получаем данные из редактора
      let lessonContent = newLesson.content;
      if (createEditorRef.current) {
        try {
          const editorData = await createEditorRef.current.save();
          lessonContent = JSON.stringify(editorData);
        } catch (err) {
          console.error('Ошибка при сохранении данных редактора:', err);
        }
      }
      
      const lessonToCreate = {
        ...newLesson,
        content: lessonContent
      };
      
      console.log(`Отправляем запрос на создание урока для курса ${course.id}:`, lessonToCreate);
      
      const response = await axios.post(`${API.LESSONS.BY_COURSE_ID(course.id)}`, lessonToCreate, {
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
      
      // Уничтожаем редактор
      if (createEditorRef.current) {
        createEditorRef.current.destroy();
        createEditorRef.current = null;
      }
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
      
      // Получаем данные из редактора
      let lessonContent = editingLesson.content;
      if (editEditorRef.current) {
        try {
          const editorData = await editEditorRef.current.save();
          lessonContent = JSON.stringify(editorData);
        } catch (err) {
          console.error('Ошибка при сохранении данных редактора:', err);
        }
      }
      
      // Создаем объект для отправки, исключая поля с undefined
      const lessonToUpdate = {
        id: editingLesson.id,
        title: editingLesson.title,
        content: lessonContent || ''
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
      
      // Уничтожаем редактор
      if (editEditorRef.current) {
        editEditorRef.current.destroy();
        editEditorRef.current = null;
      }
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
          <div id="edit-editor"></div>
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
          <div id="create-editor"></div>
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
                  {getContentPreview(lesson.content)}
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
