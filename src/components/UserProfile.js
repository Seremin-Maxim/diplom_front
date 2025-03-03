import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile. Please try again later.');
        setLoading(false);
        
        // Если ошибка 401 (Unauthorized), перенаправляем на страницу входа
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = () => {
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    // Перенаправляем на страницу входа
    navigate('/login');
  };

  if (loading) {
    return <div className="user-profile-container">Loading...</div>;
  }

  if (error) {
    return <div className="user-profile-container error">{error}</div>;
  }

  return (
    <div className="user-profile-container">
      <h2>User Profile</h2>
      {user && (
        <div className="profile-info">
          <div className="profile-field">
            <label>Email:</label>
            <p>{user.email}</p>
          </div>
          <div className="profile-field">
            <label>First Name:</label>
            <p>{user.firstName}</p>
          </div>
          <div className="profile-field">
            <label>Last Name:</label>
            <p>{user.lastName}</p>
          </div>
        </div>
      )}
      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default UserProfile;