import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import CourseEditor from './components/CourseEditor';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherProtectedRoute from './components/TeacherProtectedRoute';
import Home from './components/Home';
import CourseDetails from './components/CourseDetails';
import LessonDetails from './components/LessonDetails';
import TestDetails from './components/TestDetails';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/courses/:courseId/edit" 
            element={
              <TeacherProtectedRoute>
                <CourseEditor />
              </TeacherProtectedRoute>
            } 
          />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/courses/:courseId" 
            element={
              <ProtectedRoute>
                <CourseDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lessons/:lessonId" 
            element={
              <ProtectedRoute>
                <LessonDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tests/:testId" 
            element={
              <ProtectedRoute>
                <TestDetails />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/home" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;