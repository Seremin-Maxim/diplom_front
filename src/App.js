import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CourseEditor from './components/CourseEditor';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherProtectedRoute from './components/TeacherProtectedRoute';
import Home from './components/Home';
import CourseDetails from './components/CourseDetailsTmp';
import LessonDetails from './components/LessonDetailsTmp';
import TestDetails from './components/TestDetailsTmp';
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
                <Profile />
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