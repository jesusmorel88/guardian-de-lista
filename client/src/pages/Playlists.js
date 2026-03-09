import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    original_url: ''
  });

  useEffect(() => {
    fetchPlaylists();
    fetchUsers();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('/api/playlists');
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error al obtener playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.filter(u => u.is_active));
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlaylist) {
        await axios.put(`/api/playlists/${editingPlaylist.id}`, {
          name: formData.name,
          original_url: formData.original_url
        });
      } else {
        await axios.post('/api/playlists', formData);
      }
      fetchPlaylists();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar playlist');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta playlist?')) return;
    try {
      await axios.delete(`/api/playlists/${id}`);
      fetchPlaylists();
    } catch (error) {
      alert('Error al eliminar playlist');
    }
  };

  const openModal = (playlist = null) => {
    if (playlist) {
      setEditingPlaylist(playlist);
      setFormData({
        user_id: playlist.user_id.toString(),
        name: playlist.name,
        original_url: playlist.original_url
      });
    } else {
      setEditingPlaylist(null);
      setFormData({
        user_id: users.length > 0 ? users[0].id.toString() : '',
        name: '',
        original_url: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPlaylist(null);
  };

  const copyToClipboard = (url) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    alert('URL copiada al portapapeles');
  };

  const getFullUrl = (protectedUrl) => {
    return window.location.origin + protectedUrl;
  };

  return (
    <div className="playlists">
      <div className="page-header">
        <h1 className="page-title">Gestión de Playlists</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nueva Playlist
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>URL Original</th>
              <th>URL Protegida</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : playlists.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No hay playlists</td></tr>
            ) : (
              playlists.map(playlist => (
                <tr key={playlist.id}>
                  <td><strong>{playlist.name}</strong></td>
                  <td>{playlist.username}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span title={playlist.original_url}>{playlist.original_url}</span>
                  </td>
                  <td>
                    <div className="url-display">
                      <span className="url-text">{getFullUrl(playlist.protected_url)}</span>
                      <button className="copy-btn" onClick={() => copyToClipboard(playlist.protected_url)}>
                        Copiar
                      </button>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openModal(playlist)} style={{ marginRight: '5px' }}>
                      Editar
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(playlist.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPlaylist ? 'Editar Playlist' : 'Nueva Playlist'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingPlaylist && (
                <div className="form-group">
                  <label className="form-label">Usuario *</label>
                  <select
                    className="form-input"
                    value={formData.user_id}
                    onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nombre de la Playlist *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Mi Lista IPTV"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL M3U Original *</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.original_url}
                  onChange={e => setFormData({ ...formData, original_url: e.target.value })}
                  placeholder="http://ejemplo.com/lista.m3u"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingPlaylist ? 'Guardar Cambios' : 'Crear Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
