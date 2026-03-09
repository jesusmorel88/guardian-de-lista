import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    expiration_date: '',
    max_devices: 1,
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        if (!updateData.expiration_date) delete updateData.expiration_date;

        await axios.put(`/api/users/${editingUser.id}`, updateData);
      } else {
        await axios.post('/api/users', formData);
      }
      fetchUsers();
      closeModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert('Error al eliminar usuario');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        expiration_date: user.expiration_date ? user.expiration_date.split('T')[0] : '',
        max_devices: user.max_devices,
        is_active: user.is_active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        expiration_date: '',
        max_devices: 1,
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const toggleUserStatus = async (user) => {
    try {
      await axios.put(`/api/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const getExpirationStatus = (user) => {
    if (!user.expiration_date) return { status: 'active', label: 'Nunca expira' };
    const expDate = new Date(user.expiration_date);
    const now = new Date();
    if (expDate < now) return { status: 'expired', label: 'Expirada' };
    return { status: 'active', label: `Expira: ${expDate.toLocaleDateString()}` };
  };

  return (
    <div className="users">
      <div className="page-header">
        <h1 className="page-title">Gestión de Usuarios</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Estado</th>
              <th>Expiración</th>
              <th>Dispositivos</th>
              <th>Conexiones</th>
              <th>Playlists</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Cargando...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>No hay usuarios</td></tr>
            ) : (
              users.map(user => {
                const expStatus = getExpirationStatus(user);
                return (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleUserStatus(user)}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${expStatus.status}`}>
                        {expStatus.label}
                      </span>
                    </td>
                    <td>{user.max_devices}</td>
                    <td>{user.active_connections || 0}</td>
                    <td>{user.playlist_count || 0}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openModal(user)} style={{ marginRight: '5px' }}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre de Usuario *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Expiración (vacío = nunca)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.expiration_date}
                  onChange={e => setFormData({ ...formData, expiration_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dispositivos Permitidos</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="10"
                  value={formData.max_devices}
                  onChange={e => setFormData({ ...formData, max_devices: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Usuario activo</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
