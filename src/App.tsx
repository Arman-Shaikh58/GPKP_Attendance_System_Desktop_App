import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/auth/Login';
import Home from './pages/home/Home';
import CreateClass from './pages/class/CreateClass';
import MainLayout from './layouts/MainLayout';
import { ThemeProvider } from './components/theme-provider';
import Class from './pages/class/Class';
import Attendance from './pages/attendance/Attendance';
import AttendanceLogsPage from './pages/attendance/AttendanceLogsPage';
import { getValue } from './utils/electronStoreService';
import Subject from './pages/subjects/Subject';
import Branches from './pages/branches/Branches';
import Teachers from './pages/teachers/Teachers';
import Profile from './pages/profile/Profile';
import Analytics from './pages/analytics/analytics';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValue('accessToken');
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getValue('accessToken');
      setIsAuthenticated(!!token);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Attendance />} />
              <Route path='/class' element={<Home />} />
              <Route path='/analytics' element={<Analytics />} />
              <Route path="/create-class" element={<CreateClass />} />
              <Route path='/class/:id' element={<Class />} />
              <Route path='/subjects' element={<Subject />} />
              <Route path='/branches' element={<Branches />} />
              <Route path='/teachers' element={<Teachers />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/attendance-logs/:subjectId/:subjectName' element={<AttendanceLogsPage />} />

            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
