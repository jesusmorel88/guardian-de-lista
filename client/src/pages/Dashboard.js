import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    playlists: 0,
    activeConnections: 0,
    blockedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Panel de Control</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-value">{loading ? '...' : stats.users}</div>
          <div className="stat-label">Total Usuarios</div>
        </div>

        <div className="stat-card playlists">
          <div className="stat-value">{loading ? '...' : stats.playlists}</div>
          <div className="stat-label">Playlists Activas</div>
        </div>

        <div className="stat-card connections">
          <div className="stat-value">{loading ? '...' : stats.activeConnections}</div>
          <div className="stat-label">Conexiones Activas</div>
        </div>

        <div className="stat-card blocked">
          <div className="stat-value">{loading ? '...' : stats.blockedToday}</div>
          <div className="stat-label">Bloqueados Hoy</div>
        </div>
      </div>

      <div className="table-container" style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '15px', fontSize: '18px' }}>Información del Sistema</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          Bienvenido al panel de administración de <strong>M3U Guardian Shield</strong>.<br/><br/>
          Esta aplicación protege tus listas M3U originales, generando URLs espejo seguras que solo pueden ser accedidas desde aplicaciones IPTV legitimate.<br/><br/>
          <strong>Funciones principales:</strong><br/>
          • Gestionar usuarios y sus playlists<br/>
          • Controlar dispositivos permitidos por usuario<br/>
          • Establecer fechas de expiración<br/>
          • Monitorear accesos y bloqueos<br/><br/>
          <strong>Nota:</strong> Las URLs protegidas terminaran en <code>.m3u</code> y solo funcionaran en aplicaciones como IPTV Smarters, TiviMate, OttPlayer, GSE Smart IPTV, y otras aplicaciones IPTV compatibles.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
