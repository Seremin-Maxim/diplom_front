import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config/api';
import './Register.css';
import './AuthBackground.css';

function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'USER' // По умолчанию роль студента
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeRole, setActiveRole] = useState('USER');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRoleChange = (role) => {
        setActiveRole(role);
        setFormData({
            ...formData,
            role: role
        });
    };

    // Эффект для анимации при смене роли
    useEffect(() => {
        const roleCards = document.querySelectorAll('.role-card');
        roleCards.forEach(card => {
            card.classList.remove('active');
            if (card.getAttribute('data-role') === activeRole) {
                card.classList.add('active');
            }
        });
    }, [activeRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.post(
                API.AUTH.SIGNUP,
                formData
            );
            console.log('Registration successful:', response.data);
            // Редирект на страницу входа после успешной регистрации
            navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="auth-background">
                <div className="education-icons">
                    <div className="icon icon-book">📚</div>
                    <div className="icon icon-pencil">✏️</div>
                    <div className="icon icon-graduation">🎓</div>
                    <div className="icon icon-lightbulb">💡</div>
                    <div className="icon icon-computer">💻</div>
                </div>
            </div>
            <div className="register-container">
                <h2>Регистрация</h2>
                {error && <div className="error-message">{error}</div>}
            
            <div className="role-selector">
                <div 
                    className={`role-card ${activeRole === 'USER' ? 'active' : ''}`}
                    data-role="USER"
                    onClick={() => handleRoleChange('USER')}
                >
                    <div className="role-icon student-icon">👨‍🎓</div>
                    <h3>Студент</h3>
                    <p>Регистрация как студент для прохождения курсов</p>
                </div>
                <div 
                    className={`role-card ${activeRole === 'TEACHER' ? 'active' : ''}`}
                    data-role="TEACHER"
                    onClick={() => handleRoleChange('TEACHER')}
                >
                    <div className="role-icon teacher-icon">👨‍🏫</div>
                    <h3>Преподаватель</h3>
                    <p>Регистрация как преподаватель для создания курсов</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Введите ваш email"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Пароль</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Введите пароль"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="firstName">Имя</label>
                    <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Введите ваше имя"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Фамилия</label>
                    <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Введите вашу фамилию"
                    />
                </div>
                
                <div className="selected-role-info">
                    <p>Выбранная роль: <strong>{activeRole === 'USER' ? 'Студент' : 'Преподаватель'}</strong></p>
                </div>
                <button type="submit" className="register-button" disabled={loading}>
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>
            <p className="login-link">
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
        </>
    );
}

export default Register;