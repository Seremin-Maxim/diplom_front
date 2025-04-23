import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './Home.css';
import Navbar from './Navbar';

/**
 * Компонент главной страницы, отображающий все доступные курсы
 */
const Home = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState(['Все', 'Программирование', 'Дизайн', 'Маркетинг', 'Бизнес']);
  const [activeCategory, setActiveCategory] = useState('Все');

  // Данные для баннера-карусели
  const banners = [
    {
      id: 1,
      title: 'Начните свой путь в программировании',
      description: 'Изучите основы программирования и станьте разработчиком с нашими курсами',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1470&auto=format&fit=crop',
      color: '#3f51b5',
      buttonText: 'Начать обучение',
      link: '/courses'
    },
    {
      id: 2,
      title: 'Освойте веб-дизайн за 8 недель',
      description: 'Научитесь создавать современные и удобные интерфейсы с нуля',
      image: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?q=80&w=1470&auto=format&fit=crop',
      color: '#4caf50',
      buttonText: 'Узнать больше',
      link: '/courses'
    },
    {
      id: 3,
      title: 'Специальное предложение',
      description: 'Скидка 30% на все курсы по маркетингу до конца месяца',
      image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1470&auto=format&fit=crop',
      color: '#ff9800',
      buttonText: 'Получить скидку',
      link: '/courses'
    }
  ];

  // Загрузка списка публичных курсов при монтировании компонента
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(API.COURSES.PUBLIC, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCourses(response.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке курсов:', err);
        setError('Не удалось загрузить курсы. Пожалуйста, попробуйте позже.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Автоматическое переключение слайдов каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [banners.length]);

  // Переключение на предыдущий слайд
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  // Переключение на следующий слайд
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  // Переключение на конкретный слайд
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Фильтрация курсов по категории
  const filteredCourses = activeCategory === 'Все' 
    ? courses 
    : courses.filter(course => course.category === activeCategory);

  return (
    <div className="home-page">
      <Navbar />
      
      {/* Баннер-карусель */}
      <div className="banner-carousel">
        <div className="banner-slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {banners.map((banner) => (
            <div 
              key={banner.id} 
              className="banner-slide"
              style={{ 
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${banner.image})` 
              }}
            >
              <div className="banner-content">
                <h1>{banner.title}</h1>
                <p>{banner.description}</p>
                <Link to={banner.link} className="banner-button" style={{ backgroundColor: banner.color }}>
                  {banner.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <button className="banner-nav banner-prev" onClick={prevSlide}>&#10094;</button>
        <button className="banner-nav banner-next" onClick={nextSlide}>&#10095;</button>
        
        <div className="banner-dots">
          {banners.map((_, index) => (
            <span 
              key={index} 
              className={`banner-dot ${currentSlide === index ? 'active' : ''}`} 
              onClick={() => goToSlide(index)}
            ></span>
          ))}
        </div>
      </div>
      
      <div className="home-container">
        <div className="home-welcome">
          <h2>Добро пожаловать на нашу образовательную платформу</h2>
          <p>Изучайте новые навыки, расширяйте свои знания и достигайте целей с нашими онлайн-курсами</p>
        </div>
        
        {/* Категории курсов */}
        <div className="course-categories">
          {categories.map(category => (
            <button 
              key={category}
              className={`category-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="courses-section">
          <div className="courses-header">
            <h2>Популярные курсы</h2>
            <Link to="/courses" className="view-all-link">Смотреть все</Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner-large"></div>
              <p>Загрузка курсов...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : filteredCourses.length === 0 ? (
            <div className="no-courses-message">
              <div className="no-courses-icon">📚</div>
              <h3>Нет доступных курсов</h3>
              <p>В данной категории пока нет курсов. Попробуйте выбрать другую категорию или вернитесь позже.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map(course => (
                <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
                  <div className="course-card-image">
                    <div className="course-card-overlay"></div>
                  </div>
                  <div className="course-card-content">
                    <div className="course-card-category">{course.category || 'Общее'}</div>
                    <h2 className="course-title">{course.title}</h2>
                    <p className="course-description">
                      {course.description && course.description.length > 100 
                        ? `${course.description.substring(0, 100)}...` 
                        : course.description}
                    </p>
                    <div className="course-meta">
                      <div className="course-meta-item">
                        <span className="course-meta-icon">📚</span>
                        <span className="course-lessons-count">
                          {course.lessonsCount || 0} уроков
                        </span>
                      </div>
                      <div className="course-meta-item">
                        <span className="course-meta-icon">👨‍🏫</span>
                        <span className="course-author">
                          {course.authorName || 'Неизвестный'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Секция преимуществ */}
        <div className="features-section">
          <h2>Почему стоит учиться с нами</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Качественное образование</h3>
              <p>Наши курсы разработаны экспертами в своих областях и постоянно обновляются</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Учитесь в своем темпе</h3>
              <p>Доступ к материалам 24/7, учитесь когда и где вам удобно</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Сертификаты</h3>
              <p>Получайте сертификаты о прохождении курсов и повышайте свою ценность на рынке труда</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Сообщество</h3>
              <p>Присоединяйтесь к сообществу студентов и преподавателей для обмена опытом</p>
            </div>
          </div>
        </div>
        
        {/* Секция призыва к действию */}
        <div className="cta-section">
          <div className="cta-content">
            <h2>Готовы начать обучение?</h2>
            <p>Присоединяйтесь к тысячам студентов, которые уже изменили свою жизнь с нашими курсами</p>
            <Link to="/courses" className="cta-button">Начать сейчас</Link>
          </div>
        </div>
      </div>
      
      {/* Футер */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>О платформе</h3>
            <p>Наша миссия - сделать качественное образование доступным для всех</p>
          </div>
          <div className="footer-section">
            <h3>Контакты</h3>
            <p>Email: info@education-platform.com</p>
            <p>Телефон: +7 (123) 456-78-90</p>
          </div>
          <div className="footer-section">
            <h3>Ссылки</h3>
            <ul>
              <li><Link to="/courses">Курсы</Link></li>
              <li><Link to="/profile">Профиль</Link></li>
              <li><Link to="/about">О нас</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Образовательная платформа. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
