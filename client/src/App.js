import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Playlists from './pages/Playlists';
import Logs from './pages/Logs';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="app">
        {!isAuthenticated ? (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        ) : (
          <div className="app-layout">
            <Sidebar onLogout={handleLogout} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/logs" element={<Logs />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
