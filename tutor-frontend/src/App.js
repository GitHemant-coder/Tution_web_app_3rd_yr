import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import './App.css';
import Navbar from './components/Navbar';
import StudentDashboard from './pages/StudentDashboard';
import Notes from './pages/Notes';
import Feedback from './pages/Feedback';
import RequestTutor from './pages/RequestTutor';
import Profile from './pages/Profile';
import PerformanceAnalysis from './pages/PerformanceAnalysis';
import PerformancePrediction from './pages/PerformancePrediction';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TeacherDashboard from './pages/TeacherDashboard';
import ViewStudents from "./pages/ViewStudents";
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/request-tutor" element={<RequestTutor />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/view-students" element={<ViewStudents />} />
        <Route path="/performance-analysis" element={<PerformanceAnalysis />} />
        <Route path="/performance-prediction" element={<PerformancePrediction />} />

      </Routes>

      {/* ✅ ToastContainer must be outside Routes */}
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
