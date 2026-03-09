import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    onLogout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">🛡️</div>
        <div className="sidebar-title">M3U Guardian Shield</div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <span className="nav-icon">📊</span>
          Dashboard
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          Usuarios
        </NavLink>

        <NavLink to="/playlists" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📺</span>
          Playlists
        </NavLink>

        <NavLink to="/logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon">📝</span>
          Logs
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
