import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, LayoutGrid, List, Save, User, Calendar, AlertCircle, Pencil } from 'lucide-react';
import { MOCK_TAREAS, MOCK_CLIENTES, MOCK_EQUIPO } from '../mocks/data';
import TablaTareas from '../components/TablaTareas';
import Modal from '../components/Modal';

const TareasView = ({ user }) => {
  const [tareas, setTareas] = useState(MOCK_TAREAS);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [filtroCliente, setFiltroCliente] = useState('all');
  const [filtroTrabajador, setFiltroTrabajador] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // State for new task
  const initialTaskState = {
    cliente_id: '',
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fecha_limite: '',
    empleados: ''
  };
  const [newTask, setNewTask] = useState(initialTaskState);
  const [errors, setErrors] = useState({});

  // Filtering logic
  const filteredTareas = useMemo(() => {
    return tareas.filter(t => {
      const matchBusqueda = t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                           t.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchEstado = filtroEstado === 'all' || t.estado === filtroEstado;
      const matchCliente = filtroCliente === 'all' || t.cliente_id === parseInt(filtroCliente);
      const matchTrabajador = filtroTrabajador === 'all' || (t.empleados && t.empleados.toLowerCase().includes(filtroTrabajador.toLowerCase()));
      
      return matchBusqueda && matchEstado && matchCliente && matchTrabajador;
    });
  }, [tareas, busqueda, filtroEstado, filtroCliente, filtroTrabajador]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validations
    if (name === 'titulo' && value.length > 50) return;
    if (name === 'descripcion' && value.length > 200) return;

    setNewTask(prev => ({ ...prev, [name]: value }));
    if (editingTask) setEditingTask(prev => ({ ...prev, [name]: value }));
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleEditClick = (tarea) => {
    setEditingTask({
      ...tarea,
      // Ensure date format for input type="date"
      fecha_limite: tarea.fecha_limite.split(' ')[0]
    });
    setShowEditModal(true);
  };

  const validateForm = (task) => {
    const newErrs = {};
    if (!task.cliente_id) newErrs.cliente_id = 'Selecciona un cliente';
    if (!task.titulo.trim()) newErrs.titulo = 'El título es obligatorio';
    if (!task.fecha_limite) newErrs.fecha_limite = 'La fecha límite es obligatoria';
    if (!task.empleados.trim()) newErrs.empleados = 'Asigna al menos a una persona';
    
    setErrors(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const handleCreateTask = () => {
    if (!validateForm(newTask)) return;

    const cliente = MOCK_CLIENTES.find(c => c.id === parseInt(newTask.cliente_id));
    const taskToAdd = {
      ...newTask,
      id: Math.max(...tareas.map(t => t.id)) + 1,
      cliente_nombre: cliente ? cliente.nombre : 'Desconocido',
      estado: 'pendiente'
    };

    setTareas([taskToAdd, ...tareas]);
    setShowModal(false);
    setNewTask(initialTaskState);
  };

  const handleUpdateTask = () => {
    if (!validateForm(editingTask)) return;

    const cliente = MOCK_CLIENTES.find(c => c.id === parseInt(editingTask.cliente_id));
    const updatedTasks = tareas.map(t => 
      t.id === editingTask.id 
        ? { ...editingTask, cliente_nombre: cliente ? cliente.nombre : 'Desconocido' } 
        : t
    );

    setTareas(updatedTasks);
    setShowEditModal(false);
    setEditingTask(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowEditModal(false);
    setNewTask(initialTaskState);
    setEditingTask(null);
    setErrors({});
  };

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-white fw-bold mb-0">Gestión de Tareas</h3>
          <p className="text-white opacity-75 small mb-0">Organiza y supervisa el flujo de trabajo</p>
        </div>
        <button 
          className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-4 py-2 shadow-sm animate-pulse-light"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> Nueva Tarea
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="row g-3 mb-4">
        {/* Search */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
            <div className="card-body p-2 d-flex align-items-center">
              <Search className="ms-2 text-white opacity-50" size={20} />
              <input 
                type="text" 
                className="form-control bg-transparent border-0 text-white shadow-none" 
                placeholder="Buscar por título o cliente..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cliente Filter */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
            <div className="card-body p-2 d-flex align-items-center">
              <Filter className="ms-2 text-white opacity-50" size={18} />
              <select 
                className="form-select bg-transparent border-0 text-white shadow-none"
                style={{ cursor: 'pointer' }}
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
              >
                <option value="all" className="bg-dark text-white">Todos los Clientes</option>
                {MOCK_CLIENTES.map(c => (
                  <option key={c.id} value={c.id} className="bg-dark text-white">{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Trabajador Filter */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px' }}>
            <div className="card-body p-2 d-flex align-items-center">
              <User className="ms-2 text-white opacity-50" size={18} />
              <select 
                className="form-select bg-transparent border-0 text-white shadow-none"
                style={{ cursor: 'pointer' }}
                value={filtroTrabajador}
                onChange={(e) => setFiltroTrabajador(e.target.value)}
              >
                <option value="all" className="bg-dark text-white">Cualquier Trabajador</option>
                {MOCK_EQUIPO.map(e => (
                  <option key={e.id} value={e.nombre} className="bg-dark text-white">{e.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Buttons */}
        <div className="col-12">
          <div className="d-flex gap-2 overflow-auto pb-2 scrollbar-none">
            {['all', 'pendiente', 'proceso', 'espera_aprobacion', 'terminada'].map(estado => (
              <button 
                key={estado}
                className={`btn btn-sm px-4 fw-bold rounded-pill text-nowrap transition-all border-0 ${
                  filtroEstado === estado 
                  ? 'btn-primary shadow-lg scale-105' 
                  : 'bg-white bg-opacity-10 text-white hover-bg-opacity-20'
                }`}
                onClick={() => setFiltroEstado(estado)}
              >
                {estado === 'all' ? 'Ver Todo' : estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm" style={{ backgroundColor: 'transparent' }}>
        <TablaTareas 
          tareas={filteredTareas} 
          user={user} 
          onEditTask={handleEditClick}
        />
      </div>

      {/* New Task Modal */}
      <Modal
        show={showModal}
        onClose={closeModal}
        title="Crear Nueva Tarea"
        icon={<Plus size={24} />}
        footer={
          <>
            <button className="btn btn-secondary flex-grow-1 fw-bold py-2" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary flex-grow-1 fw-bold py-2" onClick={handleCreateTask}>Crear Tarea</button>
          </>
        }
      >
        <div className="row g-3">
          <div className="col-md-12">
            <label className="form-label small fw-bold text-white">Cliente</label>
            <select 
              name="cliente_id"
              className={`form-select form-control-dark ${errors.cliente_id ? 'is-invalid' : ''}`}
              value={newTask.cliente_id}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar cliente...</option>
              {MOCK_CLIENTES.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {errors.cliente_id && <div className="invalid-feedback">{errors.cliente_id}</div>}
          </div>

          <div className="col-md-12">
            <label className="form-label small fw-bold text-white">Título de la Tarea (Máx 50)</label>
            <input 
              type="text" 
              name="titulo"
              className={`form-control form-control-dark ${errors.titulo ? 'is-invalid' : ''}`}
              placeholder="Ej: Diseño de Logo"
              value={newTask.titulo}
              onChange={handleInputChange}
            />
            {errors.titulo && <div className="invalid-feedback">{errors.titulo}</div>}
          </div>

          <div className="col-md-12">
            <label className="form-label small fw-bold text-white">Descripción (Máx 200)</label>
            <textarea 
              name="descripcion"
              className="form-control form-control-dark"
              rows="3"
              placeholder="Detalles sobre la tarea..."
              value={newTask.descripcion}
              onChange={handleInputChange}
            ></textarea>
            <div className="text-end mt-1">
              <small className={`extreme-small ${newTask.descripcion.length >= 180 ? 'text-warning' : 'text-muted'}`}>
                {newTask.descripcion.length}/200
              </small>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-bold text-white">Prioridad</label>
            <select 
              name="prioridad"
              className="form-select form-control-dark"
              value={newTask.prioridad}
              onChange={handleInputChange}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-bold text-white">Fecha Límite</label>
            <input 
              type="date" 
              name="fecha_limite"
              className={`form-control form-control-dark ${errors.fecha_limite ? 'is-invalid' : ''}`}
              value={newTask.fecha_limite}
              onChange={handleInputChange}
            />
            {errors.fecha_limite && <div className="invalid-feedback">{errors.fecha_limite}</div>}
          </div>

          <div className="col-md-12">
            <label className="form-label small fw-bold text-white">Asignar a (Separado por comas)</label>
            <div className="input-group">
              <span className="input-group-text bg-deep border-secondary border-opacity-10 text-muted">
                <User size={16} />
              </span>
              <input 
                type="text" 
                name="empleados"
                className={`form-control form-control-dark ${errors.empleados ? 'is-invalid' : ''}`}
                placeholder="Juan Pérez, Maria García..."
                value={newTask.empleados}
                onChange={handleInputChange}
              />
              {errors.empleados && <div className="invalid-feedback">{errors.empleados}</div>}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        show={showEditModal}
        onClose={closeModal}
        title="Editar Tarea"
        icon={<Pencil size={24} />}
        footer={
          <>
            <button className="btn btn-secondary flex-grow-1 fw-bold py-2" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary flex-grow-1 fw-bold py-2" onClick={handleUpdateTask}>Guardar Cambios</button>
          </>
        }
      >
        {editingTask && (
          <div className="row g-3">
            <div className="col-md-12">
              <label className="form-label small fw-bold text-white">Cliente</label>
              <select 
                name="cliente_id"
                className={`form-select form-control-dark ${errors.cliente_id ? 'is-invalid' : ''}`}
                value={editingTask.cliente_id}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar cliente...</option>
                {MOCK_CLIENTES.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.cliente_id && <div className="invalid-feedback">{errors.cliente_id}</div>}
            </div>

            <div className="col-md-12">
              <label className="form-label small fw-bold text-white">Título de la Tarea (Máx 50)</label>
              <input 
                type="text" 
                name="titulo"
                className={`form-control form-control-dark ${errors.titulo ? 'is-invalid' : ''}`}
                placeholder="Ej: Diseño de Logo"
                value={editingTask.titulo}
                onChange={handleInputChange}
              />
              {errors.titulo && <div className="invalid-feedback">{errors.titulo}</div>}
            </div>

            <div className="col-md-12">
              <label className="form-label small fw-bold text-white">Descripción (Máx 200)</label>
              <textarea 
                name="descripcion"
                className="form-control form-control-dark"
                rows="3"
                placeholder="Detalles sobre la tarea..."
                value={editingTask.descripcion}
                onChange={handleInputChange}
              ></textarea>
              <div className="text-end mt-1">
                <small className={`extreme-small ${editingTask.descripcion.length >= 180 ? 'text-warning' : 'text-muted'}`}>
                  {editingTask.descripcion.length}/200
                </small>
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold text-white">Prioridad</label>
              <select 
                name="prioridad"
                className="form-select form-control-dark"
                value={editingTask.prioridad}
                onChange={handleInputChange}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold text-white">Estado</label>
              <select 
                name="estado"
                className="form-select form-control-dark"
                value={editingTask.estado}
                onChange={handleInputChange}
              >
                <option value="pendiente">Pendiente</option>
                <option value="proceso">En Proceso</option>
                <option value="espera_aprobacion">Esperando Aprobación</option>
                <option value="terminada">Terminada</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold text-white">Fecha Límite</label>
              <input 
                type="date" 
                name="fecha_limite"
                className={`form-control form-control-dark ${errors.fecha_limite ? 'is-invalid' : ''}`}
                value={editingTask.fecha_limite}
                onChange={handleInputChange}
              />
              {errors.fecha_limite && <div className="invalid-feedback">{errors.fecha_limite}</div>}
            </div>

            <div className="col-md-6">
              <label className="form-label small fw-bold text-white">Asignados</label>
              <div className="input-group">
                <span className="input-group-text bg-deep border-secondary border-opacity-10 text-muted">
                  <User size={16} />
                </span>
                <input 
                  type="text" 
                  name="empleados"
                  className={`form-control form-control-dark ${errors.empleados ? 'is-invalid' : ''}`}
                  placeholder="Juan Pérez, Maria García..."
                  value={editingTask.empleados}
                  onChange={handleInputChange}
                />
                {errors.empleados && <div className="invalid-feedback">{errors.empleados}</div>}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .extreme-small { font-size: 0.7rem; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default TareasView;
