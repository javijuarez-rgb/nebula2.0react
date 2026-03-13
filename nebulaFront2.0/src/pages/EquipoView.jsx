import React, { useState } from 'react';
import { MOCK_EQUIPO } from '../mocks/data';
import { UserPlus, Pencil, Trash2, Shield, User, Key, X } from 'lucide-react';

const EquipoView = () => {
  const [equipo, setEquipo] = useState(MOCK_EQUIPO);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
    setEquipo(equipo.map(u => u.id === selectedUser.id ? selectedUser : u));
    setShowEditModal(false);
  };

  const closeModal = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const validateName = (text) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text) && text.length <= 40;
  const validateUser = (text) => text.length >= 3 && text.length <= 20;
  const validateAlphanumeric = (text) => /^[a-zA-Z0-9]*$/.test(text);

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nombre' && !validateName(value)) return;
    if (name === 'usuario' && value.length > 20) return;
  };

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="row g-4">
        {/* Sidebar: Nuevo Usuario */}
        <div className="col-lg-3">
          <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="p-2 rounded bg-primary-subtle text-primary">
                  <UserPlus size={20} />
                </div>
                <h5 className="mb-0 fw-bold" style={{ color: 'var(--primary-color)' }}>Nuevo Usuario</h5>
              </div>

              <form>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-white">Nombre Real</label>
                  <input 
                    type="text" 
                    name="nombre"
                    className="form-control-dark form-control" 
                    placeholder="Nombre y Apellidos"
                    onChange={handleNewUserChange}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-white">Usuario Login</label>
                  <input 
                    type="text" 
                    name="usuario"
                    className="form-control-dark form-control" 
                    placeholder="nombre.usuario"
                  />
                </div>

                <div className="form-check p-3 rounded mb-4 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)', minHeight: '45px' }}>
                  <input className="form-check-input ms-0" type="checkbox" id="esAdminSwitch" style={{ marginTop: '0' }} />
                  <label className="form-check-label small fw-bold text-white cursor-pointer" htmlFor="esAdminSwitch">¿Es Administrador?</label>
                </div>

                <button type="button" className="btn btn-primary w-100 fw-bold py-2 shadow-sm">
                  Crear Usuario
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main: Tabla de Equipo */}
        <div className="col-lg-9">
          <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--bg-card)' }}>
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

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div 
          className="modal-overlay d-flex align-items-center justify-content-center animate__animated animate__fadeIn"
          onClick={closeModal}
        >
          <div 
            className="modal-content-custom card shadow-lg border-0" 
            style={{ width: '450px', backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header border-secondary border-opacity-10 d-flex justify-content-between align-items-center p-3">
              <h5 className="mb-0 fw-bold text-white">Editar Integrante</h5>
              <button className="btn btn-link text-white p-0" onClick={closeModal}><X size={20}/></button>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label small fw-bold text-white">Nombre Real (Máx 40, sin números)</label>
                <input 
                  type="text" 
                  className="form-control form-control-dark" 
                  value={selectedUser.nombre}
                  onChange={(e) => {
                    if (validateName(e.target.value)) setSelectedUser({...selectedUser, nombre: e.target.value})
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-white">Usuario Login (3-20 caracteres)</label>
                <input 
                  type="text" 
                  className="form-control form-control-dark" 
                  value={selectedUser.usuario}
                  onChange={(e) => {
                    if (e.target.value.length <= 20) setSelectedUser({...selectedUser, usuario: e.target.value})
                  }}
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold text-white">Rol de Usuario</label>
                <select 
                  className="form-select form-control-dark" 
                  value={selectedUser.rol}
                  onChange={(e) => setSelectedUser({...selectedUser, rol: e.target.value})}
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
                  className="form-control form-control-dark" 
                  placeholder="Letras y números"
                  value={selectedUser.pin_generado}
                  onChange={(e) => {
                    if (validateAlphanumeric(e.target.value)) setSelectedUser({...selectedUser, pin_generado: e.target.value})
                  }}
                />
              </div>
              <div className="d-flex gap-2 mt-4">
                <button className="btn btn-secondary flex-grow-1 fw-bold" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-primary flex-grow-1 fw-bold" onClick={saveEdit}>Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div 
          className="modal-overlay d-flex align-items-center justify-content-center animate__animated animate__fadeIn"
          onClick={closeModal}
        >
          <div 
            className="modal-content-custom card shadow-lg border-0" 
            style={{ width: '400px', backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-body p-4 text-center">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle d-inline-block mb-3">
                <Trash2 size={32} />
              </div>
              <h5 className="fw-bold text-white mb-2">¿Eliminar Usuario?</h5>
              <p className="text-muted small mb-4">
                Estás a punto de eliminar a <strong>{selectedUser.nombre}</strong>. Esta acción no se puede deshacer.
              </p>
              <div className="d-flex gap-2">
                <button className="btn btn-secondary flex-grow-1 fw-bold" onClick={closeModal}>Cancelar</button>
                <button className="btn btn-danger flex-grow-1 fw-bold" onClick={confirmDelete}>Sí, Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal styles */}
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 1050;
        }
        .animate__animated {
          animation-duration: 0.3s;
        }
        .cursor-pointer { cursor: pointer; }
        .hover-primary:hover { color: var(--primary-color) !important; transform: scale(1.1); transition: all 0.2s; }
        .hover-danger:hover { color: #ffffff !important; background-color: var(--bs-danger) !important; transform: scale(1.1); transition: all 0.2s; }
        .hover-danger:hover svg { color: #ffffff !important; }
      `}</style>
    </div>
  );
};

export default EquipoView;
