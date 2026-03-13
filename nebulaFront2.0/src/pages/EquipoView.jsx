import React, { useState } from 'react';
import { MOCK_EQUIPO } from '../mocks/data';
import { UserPlus, Pencil, Trash2, Shield, User, Key } from 'lucide-react';
import Modal from '../components/Modal';

const EquipoView = () => {
  const [equipo, setEquipo] = useState(MOCK_EQUIPO);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [errors, setErrors] = useState({});

  const initialUserState = {
    nombre: '',
    usuario: '',
    rol: 'Empleado',
    pin_generado: ''
  };
  const [newUser, setNewUser] = useState(initialUserState);

  // Handlers for Modals
  const handleEdit = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setEquipo(equipo.filter(u => u.id !== selectedUser.id));
    setShowDeleteModal(false);
  };

  const saveEdit = () => {
    if (!validateForm(selectedUser)) return;
    setEquipo(equipo.map(u => u.id === selectedUser.id ? selectedUser : u));
    setShowEditModal(false);
  };

  const validateForm = (user) => {
    const newErrs = {};
    if (!user.nombre || !user.nombre.trim()) newErrs.nombre = 'El nombre es obligatorio';
    if (!user.usuario || !user.usuario.trim()) newErrs.usuario = 'El usuario es obligatorio';
    else if (user.usuario.length < 3) newErrs.usuario = 'Mínimo 3 caracteres';
    
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleCreateUser = () => {
    if (!validateForm(newUser)) return;
    const id = equipo.length > 0 ? Math.max(...equipo.map(u => u.id)) + 1 : 1;
    const pin = newUser.pin_generado || Math.random().toString(36).substring(2, 8).toUpperCase();
    
    setEquipo([...equipo, { ...newUser, id, pin_generado: pin }]);
    setShowCreateModal(false);
    setNewUser(initialUserState);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
    setErrors({});
  };

  const validateName = (text) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text) && text.length <= 40;
  const validateAlphanumeric = (text) => /^[a-zA-Z0-9]*$/.test(text);

  const handleInputChange = (e, isEdit = false) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nombre' && !validateName(value)) return;
    if (name === 'usuario' && value.length > 20) return;
    if (name === 'pin_generado' && !validateAlphanumeric(value)) return;

    if (isEdit) {
      setSelectedUser({ ...selectedUser, [name]: value });
    } else {
      const val = type === 'checkbox' ? (checked ? 'Admin' : 'Empleado') : value;
      setNewUser({ ...newUser, [name]: val });
    }

    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-end mb-4">
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-4 py-2 shadow-sm"
          onClick={() => setShowCreateModal(true)}
        >
          <UserPlus size={20} /> Nuevo Integrante
        </button>
      </div>

      <div className="row g-4">
        {/* Main: Tabla de Equipo */}
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '15px' }}>
            <div className="card-body p-0">
              <div className="p-4 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-white">Integrantes del Equipo</h5>
                <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                  {equipo.length} Miembros
                </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-deep">
                    <tr>
                      <th className="ps-4">Nombre</th>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Clave/PIN</th>
                      <th className="text-center pe-4" style={{ width: '120px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipo.map((member) => (
                      <tr key={member.id} className="border-secondary border-opacity-10">
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div className="p-2 rounded-circle bg-dark border border-secondary border-opacity-25 text-dim">
                              {member.rol.toLowerCase().includes('admin') ? <Shield size={16} /> : <User size={16} />}
                            </div>
                            <span className="fw-bold text-white">{member.nombre}</span>
                          </div>
                        </td>
                        <td>
                          <code className="small text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                            {member.usuario}
                          </code>
                        </td>
                        <td>
                          <span className={`badge rounded-pill px-3 ${
                            member.rol === 'Superadmin' ? 'bg-danger-subtle text-danger' : 
                            member.rol === 'Admin' ? 'bg-warning-subtle text-warning' : 
                            'bg-info-subtle text-info'
                          }`}>
                            {member.rol}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                             <div className="bg-warning bg-opacity-10 p-1 px-2 rounded border border-warning border-opacity-25 d-flex align-items-center gap-2">
                                <Key size={12} className="text-warning" />
                                <span className="small fw-bold text-white">{member.pin_generado}</span>
                             </div>
                          </div>
                        </td>
                        <td className="pe-4 text-center">
                          <button 
                            className="btn btn-sm btn-outline-secondary border-0 p-2 me-1 hover-primary"
                            onClick={() => handleEdit(member)}
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger border-0 p-2 hover-danger"
                            onClick={() => handleDelete(member)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        show={showCreateModal}
        onClose={closeModal}
        title="Crear Nuevo Integrante"
        icon={<UserPlus size={24} />}
        footer={
          <>
            <button className="btn btn-secondary flex-grow-1 fw-bold py-2" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary flex-grow-1 fw-bold py-2" onClick={handleCreateUser}>Crear Usuario</button>
          </>
        }
      >
        <div className="animate__animated animate__fadeIn">
          <div className="mb-3">
            <label className="form-label small fw-bold text-white">Nombre Real (Máx 40, sin números)</label>
            <input 
              type="text" 
              name="nombre"
              className={`form-control form-control-dark ${errors.nombre ? 'is-invalid' : ''}`} 
              placeholder="Nombre y Apellidos"
              value={newUser.nombre}
              onChange={handleInputChange}
            />
            {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold text-white">Usuario Login (3-20 caracteres)</label>
            <input 
              type="text" 
              name="usuario"
              className={`form-control form-control-dark ${errors.usuario ? 'is-invalid' : ''}`} 
              placeholder="nombre.usuario"
              value={newUser.usuario}
              onChange={handleInputChange}
            />
            {errors.usuario && <div className="invalid-feedback">{errors.usuario}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label small fw-bold text-white">Rol de Usuario</label>
            <select 
              name="rol"
              className="form-select form-control-dark" 
              value={newUser.rol}
              onChange={handleInputChange}
            >
              <option value="Empleado">Empleado</option>
              <option value="Admin">Admin</option>
              <option value="Superadmin">Superadmin</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label small fw-bold text-white">Clave/PIN (Opcional)</label>
            <input 
              type="text" 
              name="pin_generado"
              className="form-control form-control-dark" 
              placeholder="Auto-generado si se deja vacío"
              value={newUser.pin_generado}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={showEditModal && selectedUser}
        onClose={closeModal}
        title="Editar Integrante"
        icon={<Pencil size={24} />}
        footer={
          <>
            <button className="btn btn-secondary flex-grow-1 fw-bold py-2" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary flex-grow-1 fw-bold py-2" onClick={saveEdit}>Guardar Cambios</button>
          </>
        }
      >
        {selectedUser && (
          <div className="animate__animated animate__fadeIn">
            <div className="mb-3">
              <label className="form-label small fw-bold text-white">Nombre Real (Máx 40, sin números)</label>
              <input 
                type="text" 
                name="nombre"
                className={`form-control form-control-dark ${errors.nombre ? 'is-invalid' : ''}`} 
                value={selectedUser.nombre}
                onChange={(e) => handleInputChange(e, true)}
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-white">Usuario Login (3-20 caracteres)</label>
              <input 
                type="text" 
                name="usuario"
                className={`form-control form-control-dark ${errors.usuario ? 'is-invalid' : ''}`} 
                value={selectedUser.usuario}
                onChange={(e) => handleInputChange(e, true)}
              />
              {errors.usuario && <div className="invalid-feedback">{errors.usuario}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label small fw-bold text-white">Rol de Usuario</label>
              <select 
                name="rol"
                className="form-select form-control-dark" 
                value={selectedUser.rol}
                onChange={(e) => handleInputChange(e, true)}
              >
                <option value="Empleado">Empleado</option>
                <option value="Admin">Admin</option>
                <option value="Superadmin">Superadmin</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="form-label small fw-bold text-white">Clave/PIN</label>
              <input 
                type="text" 
                name="pin_generado"
                className="form-control form-control-dark" 
                placeholder="Letras y números"
                value={selectedUser.pin_generado}
                onChange={(e) => handleInputChange(e, true)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={showDeleteModal && selectedUser}
        onClose={closeModal}
        title="Eliminar Usuario"
        icon={<Trash2 size={24} />}
        footer={
          <>
            <button className="btn btn-secondary flex-grow-1 fw-bold py-2" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-danger flex-grow-1 fw-bold py-2" onClick={confirmDelete}>Sí, Eliminar</button>
          </>
        }
      >
        {selectedUser && (
          <div className="text-center py-2 animate__animated animate__fadeIn">
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-block mb-3">
              <Trash2 size={40} />
            </div>
            <h5 className="fw-bold text-white mb-2">¿Estás seguro?</h5>
            <p className="text-white opacity-75 small mb-0 px-3">
              Estás a punto de eliminar a <strong>{selectedUser.nombre}</strong>. Esta acción no se puede deshacer y el usuario perderá el acceso inmediatamente.
            </p>
          </div>
        )}
      </Modal>

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .hover-primary:hover { color: var(--primary-color) !important; transform: scale(1.1); transition: all 0.2s; }
        .hover-danger:hover { color: #ffffff !important; background-color: var(--bs-danger) !important; transform: scale(1.1); transition: all 0.2s; }
        .hover-danger:hover svg { color: #ffffff !important; }
      `}</style>
    </div>
  );
};

export default EquipoView;
