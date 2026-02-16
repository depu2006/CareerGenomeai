import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import SkillGenome from './pages/SkillGenome';
import Readiness from './pages/Readiness';
import Opportunities from './pages/Opportunities';
import Landing from './pages/Landing';
import YourDetails from './pages/YourDetails';
import FailureIntelligence from './pages/FailureIntelligence';
import ProjectGenerator from './pages/ProjectGenerator';
import SkillGapClosure from './pages/SkillGapClosure';
import SkillAssessment from './pages/SkillAssessment';
import RoadmapGenerator from './pages/RoadmapGenerator';
import InterviewPrep from './pages/InterviewPrep';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="genome" element={<SkillGenome />} />
              <Route path="readiness" element={<Readiness />} />
              <Route path="opportunities" element={<Opportunities />} />
              <Route path="details" element={<YourDetails />} />
              <Route path="failures" element={<FailureIntelligence />} />
              <Route path="project-generator" element={<ProjectGenerator />} />
              <Route path="skill-gap" element={<SkillGapClosure />} />
              <Route path="assessment" element={<SkillAssessment />} />
              <Route path="roadmap" element={<RoadmapGenerator />} />
              <Route path="interview-prep" element={<InterviewPrep />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
