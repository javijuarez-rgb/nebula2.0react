import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CLIENTES } from '../mocks/data';
import { Search, UserPlus, Phone, MapPin, BadgeCheck, X, Save, DollarSign, Globe, Instagram, Facebook, Mail, Youtube, Chrome, Linkedin, Twitter, Coffee, Utensils, Info } from 'lucide-react';

const ClientesView = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState(MOCK_CLIENTES);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [errors, setErrors] = useState({});
  const initialClientState = {
    nombre: '',
    telefono: '',
    ubicacion: '',
    descripcion: '',
    es_activo: true,
    es_potencial: false,
    tiene_iva: true,
    tiene_irpf: true,
    ing_budget: '',
    ing_real: '',
    cost_budget: '',
    cost_real: '',
    social: {
      ig: { label: 'Instagram', enabled: false, user: '', pass: '', hasPass: true },
      fb: { label: 'Facebook', enabled: false, user: '', pass: '', hasPass: true },
      email: { label: 'Correo', enabled: false, user: '', pass: '', hasPass: true },
      yt: { label: 'YouTube', enabled: false, user: '', pass: '', hasPass: true },
      wp: { label: 'WordPress', enabled: false, user: '', pass: '', hasPass: true },
      tiktok: { label: 'TikTok', enabled: false, user: '', pass: '', hasPass: true },
      smart: { label: 'SmartLinks', enabled: false, user: '', pass: '', hasPass: false },
      reserva: { label: 'Reservas', enabled: false, user: '', pass: '', hasPass: false },
      linkedin: { label: 'LinkedIn', enabled: false, user: '', pass: '', hasPass: true },
      dish: { label: 'Dish', enabled: false, user: '', pass: '', hasPass: true },
      x: { label: 'X (Twitter)', enabled: false, user: '', pass: '', hasPass: true },
      trip: { label: 'TripAdvisor', enabled: false, user: '', pass: '', hasPass: true },
      avo: { label: 'Avocaty', enabled: false, user: '', pass: '', hasPass: true },
      cover: { label: 'Cover Manager', enabled: false, user: '', pass: '', hasPass: true },
      milan: { label: 'Mil Anuncios', enabled: false, user: '', pass: '', hasPass: true },
    }
  };

  const [newClient, setNewClient] = useState(initialClientState);
  const [editingClient, setEditingClient] = useState(null);

  const validateTextNoNumbers = (text) => {
    // Letters, spaces, accents, NO numbers
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(text);
  };

  const handleInputChange = (e, isEdit = false) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nombre') {
      if (!validateTextNoNumbers(value) || value.length > 40) return;
    }
    if (name === 'ubicacion') {
      if (value.length > 100) return;
    }
    if (name === 'telefono') {
      if (!/^[0-9]*$/.test(value) || value.length > 9) return;
    }

    const val = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : parseFloat(value)) : value);

    if (isEdit) {
      let updated = { ...editingClient, [name]: val };
      if (name === 'es_activo' && val === true) updated.es_potencial = false;
      if (name === 'es_potencial' && val === true) updated.es_activo = false;
      setEditingClient(updated);
    } else {
      let updated = { ...newClient, [name]: val };
      if (name === 'es_activo' && val === true) updated.es_potencial = false;
      if (name === 'es_potencial' && val === true) updated.es_activo = false;
      setNewClient(updated);
    }
  };

  const handleToggleSocial = (key, isEdit = false) => {
    if (isEdit) {
      setEditingClient({
        ...editingClient,
        social: {
          ...editingClient.social,
          [key]: { ...editingClient.social[key], enabled: !editingClient.social[key].enabled }
        }
      });
    } else {
      setNewClient({
        ...newClient,
        social: {
          ...newClient.social,
          [key]: { ...newClient.social[key], enabled: !newClient.social[key].enabled }
        }
      });
    }
  };

  const handleSocialChange = (key, field, value, isEdit = false) => {
    if (isEdit) {
      setEditingClient({
        ...editingClient,
        social: {
          ...editingClient.social,
          [key]: { ...editingClient.social[key], [field]: value }
        }
      });
    } else {
      setNewClient({
        ...newClient,
        social: {
          ...newClient.social,
          [key]: { ...newClient.social[key], [field]: value }
        }
      });
    }
  };

  const openEditModal = (client) => {
    setEditingClient({
      ...initialClientState,
      ...client,
      ing_budget: client.ing_budget || '',
      ing_real: client.ing_real || '',
      cost_budget: client.cost_budget || '',
      cost_real: client.cost_real || '',
      social: client.social || initialClientState.social
    });
    setShowEditModal(true);
  };

  const handleUpdateClient = (e) => {
    e.preventDefault();
    // Validaciones básicas antes de guardar
    if (!editingClient.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    
    // Simulamos guardado actualizando el estado local
    setClientes(clientes.map(c => c.id === editingClient.id ? editingClient : c));
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setShowEditModal(false);
    setEditingClient(null);
  };

  // Filtramos en tiempo real
  const clientesFiltrados = clientes.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white fw-bold">Gestión de Clientes</h3>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-4 shadow-sm"
          onClick={() => setShowModal(true)}
        >
          <UserPlus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Buscador inteligente */}
      <div className="input-group mb-4 shadow-sm border-0 rounded-3 overflow-hidden" style={{ border: '1px solid var(--border-color) !important' }}>
        <span className="input-group-text border-0" style={{ backgroundColor: 'var(--bg-card)', color: '#ffffff' }}>
          <Search size={18} />
        </span>
        <input 
          type="text" 
          className="form-control border-0 py-3" 
          style={{ backgroundColor: 'var(--bg-card)', color: '#ffffff' }}
          placeholder="Buscar por nombre, teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="row g-3">
        {clientesFiltrados.map(cliente => (
            <div key={cliente.id} className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', transition: '0.3s' }}>
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="card-title mb-0 fw-bold" style={{ color: 'var(--primary-color)' }}>{cliente.nombre}</h5>
                    <span className={`badge rounded-pill px-3 py-2 ${
                      cliente.es_activo ? 'bg-success-subtle text-success' : 
                      cliente.es_potencial ? 'bg-warning-subtle text-warning' : 
                      'bg-secondary-subtle text-secondary'
                    }`}>
                      {cliente.es_activo ? 'ACTIVO' : cliente.es_potencial ? 'POTENCIAL' : 'INACTIVO'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2 text-white opacity-90 small">
                      <Phone size={14} className="text-primary" /> {cliente.telefono}
                    </div>
                    <div className="d-flex align-items-center gap-2 text-white opacity-90 small">
                      <MapPin size={14} className="text-primary" /> {cliente.direccion || 'Sin ubicación'}
                    </div>
                  </div>


                <div className="d-flex gap-2 mt-auto">
                  <button 
                    className="btn btn-sm btn-outline-primary flex-grow-1 fw-bold py-2"
                    onClick={() => openEditModal(cliente)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-info flex-grow-1 fw-bold py-2"
                    onClick={() => navigate(`/estrategia/${cliente.id}`)}
                  >
                    Estrategia
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Nuevo Cliente */}
      {showModal && (
        <div className="modal-overlay d-flex justify-content-center align-items-start py-5 overflow-auto" onClick={closeModal}>
          <div 
            className="card shadow-lg border-0 animate__animated animate__zoomIn" 
            style={{ width: '850px', backgroundColor: 'var(--bg-card)', maxWidth: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header border-secondary border-opacity-10 d-flex justify-content-between align-items-center p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded bg-primary bg-opacity-10 text-primary">
                  <UserPlus size={24} />
                </div>
                <h4 className="mb-0 fw-bold text-white">Nuevo Cliente</h4>
              </div>
              <button className="btn btn-link text-white p-0" onClick={closeModal}><X size={24}/></button>
            </div>
            
            <div className="card-body p-4">
              <form className="row g-4">
                {/* Sección 1: Información General */}
                <div className="col-md-6">
                  <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                    <Info size={16} /> Datos Generales
                  </h6>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Nombre del Cliente (Máx 40, sin números)</label>
                    <input 
                      type="text" 
                      name="nombre"
                      className="form-control form-control-dark" 
                      placeholder="Ej: Restaurante Aurora" 
                      value={newClient.nombre}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Teléfono de Contacto (9 dígitos)</label>
                    <input 
                      type="text" 
                      name="telefono"
                      className="form-control form-control-dark" 
                      placeholder="600000000" 
                      value={newClient.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Ubicación / Dirección (Máx 100)</label>
                    <input 
                      type="text" 
                      name="ubicacion"
                      className="form-control form-control-dark" 
                      placeholder="Calle, Ciudad..." 
                      value={newClient.ubicacion}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Descripción / Notas</label>
                    <textarea 
                      name="descripcion"
                      className="form-control form-control-dark" 
                      rows="3" 
                      placeholder="Detalles relevantes..."
                      value={newClient.descripcion}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <h6 className="text-primary fw-bold mt-4 mb-3 d-flex align-items-center gap-2">
                    <DollarSign size={16} /> Finanzas y Estados
                  </h6>
                  <div className="p-3 rounded border border-secondary border-opacity-10" style={{ backgroundColor: 'var(--bg-deep)' }}>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Ingreso Budget</label>
                        <input 
                          type="number" 
                          name="ing_budget"
                          className="form-control form-control-sm form-control-dark" 
                          placeholder="0.00" 
                          value={newClient.ing_budget}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Ingreso Real</label>
                        <input 
                          type="number" 
                          name="ing_real"
                          className="form-control form-control-sm form-control-dark" 
                          placeholder="0.00" 
                          value={newClient.ing_real}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Coste Budget</label>
                        <input 
                          type="number" 
                          name="cost_budget"
                          className="form-control form-control-sm form-control-dark" 
                          placeholder="0.00" 
                          value={newClient.cost_budget}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Coste Real</label>
                        <input 
                          type="number" 
                          name="cost_real"
                          className="form-control form-control-sm form-control-dark" 
                          placeholder="0.00" 
                          value={newClient.cost_real}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input className="form-check-input ms-0 me-2" type="checkbox" id="checkActivo" defaultChecked />
                          <label className="form-check-label small fw-bold text-success" htmlFor="checkActivo">Activo</label>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input className="form-check-input ms-0 me-2" type="checkbox" id="checkPotencial" />
                          <label className="form-check-label small fw-bold text-warning" htmlFor="checkPotencial">Potencial</label>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input className="form-check-input ms-0 me-2" type="checkbox" id="checkIva" defaultChecked />
                          <label className="form-check-label small text-white opacity-75" htmlFor="checkIva">IVA (21%)</label>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input className="form-check-input ms-0 me-2" type="checkbox" id="checkIrpf" defaultChecked />
                          <label className="form-check-label small text-white opacity-75" htmlFor="checkIrpf">Retención (15%)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Redes Sociales */}
                <div className="col-md-6">
                  <h6 className="text-secondary fw-bold mb-3 d-flex align-items-center gap-2">
                    <Globe size={16} /> Redes y Credenciales
                  </h6>
                  <div className="social-container overflow-auto pe-2" style={{ maxHeight: '450px' }}>
                    {Object.entries(newClient.social).map(([key, data]) => (
                      <div key={key} className="mb-3 pb-3 border-bottom border-secondary border-opacity-10">
                        <div className="form-check d-flex align-items-center gap-2 mb-2 p-0">
                          <input 
                            className="form-check-input ms-0" 
                            type="checkbox" 
                            id={`check_${key}`}
                            checked={data.enabled}
                            onChange={() => handleToggleSocial(key)}
                          />
                          <label className="form-check-label fw-bold text-white small cursor-pointer" htmlFor={`check_${key}`}>
                            {data.label}
                          </label>
                        </div>
                        {data.enabled && (
                          <div className="ms-4 animate__animated animate__fadeIn">
                            <input 
                              type="text" 
                              className="form-control form-control-sm form-control-dark mb-1" 
                              placeholder="Usuario o Enlace"
                              value={data.user}
                              onChange={(e) => handleSocialChange(key, 'user', e.target.value)}
                            />
                            {data.hasPass && (
                              <input 
                                type="text" 
                                className="form-control form-control-sm form-control-dark" 
                                placeholder="Contraseña"
                                value={data.pass}
                                onChange={(e) => handleSocialChange(key, 'pass', e.target.value)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12 mt-4 pt-3 border-top border-secondary border-opacity-10 d-flex gap-2">
                  <button type="button" className="btn btn-secondary flex-grow-1 fw-bold py-3" onClick={closeModal}>Cancelar</button>
                  <button type="button" className="btn btn-primary flex-grow-1 fw-bold py-3">
                    <Save size={20} className="me-2" /> Guardar Nuevo Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Cliente */}
      {showEditModal && editingClient && (
        <div className="modal-overlay d-flex justify-content-center align-items-start py-5 overflow-auto" onClick={closeModal}>
          <div 
            className="card shadow-lg border-0 animate__animated animate__fadeInUp" 
            style={{ width: '850px', backgroundColor: 'var(--bg-card)', maxWidth: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header border-secondary border-opacity-10 d-flex justify-content-between align-items-center p-4">
              <div className="d-flex align-items-center gap-3">
                <div className="p-2 rounded bg-info bg-opacity-10 text-info">
                  <UserPlus size={24} />
                </div>
                <h4 className="mb-0 fw-bold text-white">Editar Cliente: {editingClient.nombre}</h4>
              </div>
              <button className="btn btn-link text-white p-0" onClick={closeModal}><X size={24}/></button>
            </div>
            
            <div className="card-body p-4">
              <form className="row g-4">
                {/* Sección 1: Información General */}
                <div className="col-md-6">
                  <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                    <Info size={16} /> Datos Generales
                  </h6>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Nombre del Cliente (Máx 40, sin números)</label>
                    <input 
                      type="text" 
                      name="nombre"
                      className="form-control form-control-dark" 
                      value={editingClient.nombre}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Teléfono de Contacto (9 dígitos)</label>
                    <input 
                      type="text" 
                      name="telefono"
                      className="form-control form-control-dark" 
                      value={editingClient.telefono}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Ubicación / Dirección (Máx 100)</label>
                    <input 
                      type="text" 
                      name="ubicacion"
                      className="form-control form-control-dark" 
                      value={editingClient.ubicacion || editingClient.direccion}
                      onChange={(e) => handleInputChange(e, true)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-white">Descripción / Notas</label>
                    <textarea 
                      name="descripcion"
                      className="form-control form-control-dark" 
                      rows="3" 
                      value={editingClient.descripcion}
                      onChange={(e) => handleInputChange(e, true)}
                    ></textarea>
                  </div>

                  <h6 className="text-primary fw-bold mt-4 mb-3 d-flex align-items-center gap-2">
                    <DollarSign size={16} /> Finanzas y Estados
                  </h6>
                  <div className="p-3 rounded border border-secondary border-opacity-10" style={{ backgroundColor: 'var(--bg-deep)' }}>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Ingreso Budget</label>
                        <input 
                          type="number" 
                          name="ing_budget"
                          className="form-control form-control-sm form-control-dark" 
                          value={editingClient.ing_budget}
                          onChange={(e) => handleInputChange(e, true)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Ingreso Real</label>
                        <input 
                          type="number" 
                          name="ing_real"
                          className="form-control form-control-sm form-control-dark" 
                          value={editingClient.ing_real}
                          onChange={(e) => handleInputChange(e, true)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Coste Budget</label>
                        <input 
                          type="number" 
                          name="cost_budget"
                          className="form-control form-control-sm form-control-dark" 
                          value={editingClient.cost_budget}
                          onChange={(e) => handleInputChange(e, true)}
                        />
                      </div>
                      <div className="col-6">
                        <label className="small fw-bold text-white opacity-75">Coste Real</label>
                        <input 
                          type="number" 
                          name="cost_real"
                          className="form-control form-control-sm form-control-dark" 
                          value={editingClient.cost_real}
                          onChange={(e) => handleInputChange(e, true)}
                        />
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input 
                            className="form-check-input ms-0 me-2" 
                            type="checkbox" 
                            name="es_activo"
                            id="editCheckActivo" 
                            checked={editingClient.es_activo} 
                            onChange={(e) => handleInputChange(e, true)}
                          />
                          <label className="form-check-label small fw-bold text-success" htmlFor="editCheckActivo">Activo</label>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input 
                            className="form-check-input ms-0 me-2" 
                            type="checkbox" 
                            name="es_potencial"
                            id="editCheckPotencial" 
                            checked={editingClient.es_potencial} 
                            onChange={(e) => handleInputChange(e, true)}
                          />
                          <label className="form-check-label small fw-bold text-warning" htmlFor="editCheckPotencial">Potencial</label>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input 
                            className="form-check-input ms-0 me-2" 
                            type="checkbox" 
                            name="tiene_iva"
                            id="editCheckIva" 
                            checked={editingClient.tiene_iva} 
                            onChange={(e) => handleInputChange(e, true)}
                          />
                          <label className="form-check-label small text-white opacity-75" htmlFor="editCheckIva">IVA (21%)</label>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-check form-switch p-2 rounded bg-dark border border-secondary border-opacity-10">
                          <input 
                            className="form-check-input ms-0 me-2" 
                            type="checkbox" 
                            name="tiene_irpf"
                            id="editCheckIrpf" 
                            checked={editingClient.tiene_irpf} 
                            onChange={(e) => handleInputChange(e, true)}
                          />
                          <label className="form-check-label small text-white opacity-75" htmlFor="editCheckIrpf">Retención (15%)</label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Redes Sociales */}
                <div className="col-md-6">
                  <h6 className="text-secondary fw-bold mb-3 d-flex align-items-center gap-2">
                    <Globe size={16} /> Redes y Credenciales
                  </h6>
                  <div className="social-container overflow-auto pe-2" style={{ maxHeight: '450px' }}>
                    {Object.entries(editingClient.social).map(([key, data]) => (
                      <div key={key} className="mb-3 pb-3 border-bottom border-secondary border-opacity-10">
                        <div className="form-check d-flex align-items-center gap-2 mb-2 p-0">
                          <input 
                            className="form-check-input ms-0" 
                            type="checkbox" 
                            id={`edit_check_${key}`}
                            checked={data.enabled}
                            onChange={() => handleToggleSocial(key, true)}
                          />
                          <label className="form-check-label fw-bold text-white small cursor-pointer" htmlFor={`edit_check_${key}`}>
                            {data.label}
                          </label>
                        </div>
                        {data.enabled && (
                          <div className="ms-4 animate__animated animate__fadeIn">
                            <input 
                              type="text" 
                              className="form-control form-control-sm form-control-dark mb-1" 
                              placeholder="Usuario o Enlace"
                              value={data.user}
                              onChange={(e) => handleSocialChange(key, 'user', e.target.value, true)}
                            />
                            {data.hasPass && (
                              <input 
                                type="text" 
                                className="form-control form-control-sm form-control-dark" 
                                placeholder="Contraseña"
                                value={data.pass}
                                onChange={(e) => handleSocialChange(key, 'pass', e.target.value, true)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12 mt-4 pt-3 border-top border-secondary border-opacity-10 d-flex gap-2">
                  <button type="button" className="btn btn-secondary flex-grow-1 fw-bold py-3" onClick={closeModal}>Cancelar</button>
                  <button type="button" className="btn btn-info flex-grow-1 fw-bold py-3 text-white" onClick={handleUpdateClient}>
                    <Save size={20} className="me-2" /> Actualizar Cliente
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          z-index: 2000;
        }
        .cursor-pointer { cursor: pointer; }
        .social-container::-webkit-scrollbar { width: 4px; }
        .social-container::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ClientesView;