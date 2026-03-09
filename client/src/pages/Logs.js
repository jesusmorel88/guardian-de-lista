import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs?limit=100');
      setLogs(response.data);
    } catch (error) {
      console.error('Error al obtener logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'SUCCESS': return 'success';
      case 'BLOCKED': return 'blocked';
      case 'ERROR': return 'error';
      default: return '';
    }
  };

  return (
    <div className="logs">
      <div className="page-header">
        <h1 className="page-title">Logs de Acceso</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 15px' }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="SUCCESS">Exitosos</option>
            <option value="BLOCKED">Bloqueados</option>
            <option value="ERROR">Errores</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchLogs}>
            Actualizar
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p className="empty-text">No hay logs de acceso</p>
          </div>
        ) : (
          <div>
            {filteredLogs.map(log => (
              <div key={log.id} className="log-entry">
                <div className="log-time">
                  {formatDate(log.created_at)}
                </div>
                <div className="log-details">
                  <span>
                    <strong>Usuario:</strong> {log.username || 'Desconocido'}
                  </span>
                  <span>
                    <strong>Playlist:</strong> {log.playlist_name || 'N/A'}
                  </span>
                  <span>
                    <strong>IP:</strong> {log.ip_address}
                  </span>
                  <span className={`log-status ${getStatusClass(log.status)}`}>
                    {log.status}
                  </span>
                </div>
                {log.reason && (
                  <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Razón: {log.reason}
                  </div>
                )}
                {log.user_agent && (
                  <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    UA: {log.user_agent.substring(0, 80)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Logs;
