import React, { useState } from 'react';
import { MOCK_TAREAS } from '../mocks/data';
import { CheckCircle, XCircle, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';

const AprobacionesView = () => {
  const [aprobaciones, setAprobaciones] = useState(
    MOCK_TAREAS.filter(t => t.estado === 'espera_aprobacion')
  );
  const [rechazoActivo, setRechazoActivo] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const handleAprobar = (id) => {
    // Aquí iría la llamada a la API (Laravel)
    setAprobaciones(aprobaciones.filter(t => t.id !== id));
    alert('Tarea aprobada con éxito');
  };

  const handleRechazar = (id) => {
    if (!motivoRechazo.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }
    // Aquí iría la llamada a la API
    setAprobaciones(aprobaciones.filter(t => t.id !== id));
    setRechazoActivo(null);
    setMotivoRechazo('');
    alert('Tarea rechazada y devuelta al empleado');
  };

  // Función para simular el linkify de PHP
  const renderMensaje = (texto) => {
    if (!texto) return <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.9em' }}>Sin nota adjunta.</span>;
    
    // Regex súper básica para URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return texto.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-info fw-bold text-decoration-underline" style={{ wordBreak: 'break-all' }}>
            {part} <LinkIcon size={12} className="ms-1"/>
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Aprobaciones Pendientes</h3>
        <span className="badge bg-warning text-dark fs-6 rounded-pill px-3 py-2 d-flex align-items-center gap-2">
          <Clock size={18} /> {aprobaciones.length} en espera
        </span>
      </div>

      {aprobaciones.length === 0 ? (
        <div className="alert alert-success d-flex align-items-center gap-3 border-0 py-4" style={{ backgroundColor: 'var(--success-pastel)', color: '#11111b' }}>
          <CheckCircle size={24} />
          <div>
            <h5 className="mb-0 fw-bold">¡Todo al día!</h5>
            <p className="mb-0 small">No hay tareas pendientes de aprobación en este momento.</p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {aprobaciones.map(tarea => (
            <div key={tarea.id} className="col-md-6">
              <div className="card h-100 shadow-sm border-warning" style={{ backgroundColor: '#1e1e2e', borderColor: 'var(--warning-pastel) !important' }}>
                <div className="card-header d-flex justify-content-between border-0 py-3" style={{ background: 'rgba(249, 226, 175, 0.1)', color: 'var(--warning-pastel)' }}>
                  <strong className="fs-5">{tarea.cliente_nombre}</strong>
                  <span className="badge bg-warning text-dark d-flex align-items-center gap-1">
                     <AlertCircle size={14} /> Esperando
                  </span>
                </div>
                
                <div className="card-body">
                  <h6 className="card-title text-white fs-5 mb-1">{tarea.titulo}</h6>
                  <p className="small text-muted mb-3">Responsables: <strong className="text-light">{tarea.empleados}</strong></p>
                  
                  <div className="p-3 rounded mb-4 shadow-sm" style={{ background: '#313244', borderLeft: '4px solid var(--primary-pastel)' }}>
                    <small className="fw-bold d-block mb-2" style={{ color: 'var(--primary-pastel)' }}>Nota del empleado:</small>
                    <div className="text-light small lh-lg">
                      {renderMensaje(tarea.mensaje_empleado)}
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleAprobar(tarea.id)}
                      className="btn btn-success flex-grow-1 d-flex justify-content-center align-items-center gap-2"
                    >
                      <CheckCircle size={18} /> Aprobar
                    </button>
                    <button 
                      onClick={() => setRechazoActivo(rechazoActivo === tarea.id ? null : tarea.id)}
                      className="btn btn-danger flex-grow-1 d-flex justify-content-center align-items-center gap-2"
                    >
                      <XCircle size={18} /> Rechazar
                    </button>
                  </div>

                  {/* Collapse para el campo de motivo de rechazo */}
                  {rechazoActivo === tarea.id && (
                    <div className="mt-3 p-3 rounded bg-dark border border-danger">
                      <label className="small fw-bold text-danger mb-2 d-flex align-items-center gap-1">
                        <AlertCircle size={14} /> Motivo del rechazo:
                      </label>
                      <textarea 
                        className="form-control form-control-sm mb-2 bg-dark text-white border-secondary"
                        rows="3"
                        placeholder="Explica qué hay que corregir..."
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        autoFocus
                      />
                      <div className="d-flex justify-content-end gap-2 mt-2">
                        <button 
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setRechazoActivo(null)}
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => handleRechazar(tarea.id)}
                          className="btn btn-sm btn-danger fw-bold"
                        >
                          Confirmar Rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AprobacionesView;
