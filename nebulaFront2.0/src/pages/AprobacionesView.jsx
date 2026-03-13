import React, { useState, useMemo } from 'react';
import { MOCK_TAREAS } from '../mocks/data';
import { CheckCircle, XCircle, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';
import Paginacion from '../components/Paginacion';

const AprobacionesView = () => {
  const [aprobaciones, setAprobaciones] = useState(
    MOCK_TAREAS.filter(t => t.estado === 'espera_aprobacion')
  );
  const [rechazoActivo, setRechazoActivo] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const mostrarNotificacion = (msj, tipo = 'success') => {
    setNotificacion({ msj, tipo, exiting: false });
    // Iniciar salida después de 2.5s
    setTimeout(() => {
      setNotificacion(prev => prev ? { ...prev, exiting: true } : null);
    }, 2500);
    // Eliminar completamente después de 3s (da tiempo a la animación)
    setTimeout(() => setNotificacion(null), 3000);
  };

  const handleAprobar = (id) => {
    setAprobaciones(aprobaciones.filter(t => t.id !== id));
    mostrarNotificacion('Tarea aprobada con éxito');
  };

  const handleRechazar = (id) => {
    if (!motivoRechazo.trim()) {
      mostrarNotificacion('Debes indicar un motivo de rechazo.', 'danger');
      return;
    }
    setAprobaciones(aprobaciones.filter(t => t.id !== id));
    setRechazoActivo(null);
    setMotivoRechazo('');
    mostrarNotificacion('Tarea rechazada y devuelta al empleado', 'warning');
  };

  // Función para simular el linkify de PHP
  const renderMensaje = (texto) => {
    if (!texto) return <span className="text-white opacity-25" style={{ fontStyle: 'italic', fontSize: '0.9em' }}>Sin nota adjunta.</span>;
    
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

  // Pagination logic
  const totalPages = Math.ceil(aprobaciones.length / itemsPerPage);
  const paginatedAprobaciones = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return aprobaciones.slice(startIndex, startIndex + itemsPerPage);
  }, [aprobaciones, currentPage]);

  // Handle page change (reset when filtering would happen, but here we only have local state filter)
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-end mb-4">
        <span className="badge bg-warning text-dark fs-6 rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-sm fw-bold">
          <Clock size={18} /> {aprobaciones.length} Pendientes
        </span>
      </div>

      {notificacion && (
        <div className={`toast-notification alert alert-${notificacion.tipo} ${notificacion.exiting ? 'exiting' : 'entering'} mx-auto shadow-lg border-0 d-flex align-items-center gap-3`} 
             style={{ maxWidth: '400px' }}>
          {notificacion.tipo === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="fw-bold">{notificacion.msj}</span>
        </div>
      )}

      {aprobaciones.length === 0 ? (
        <div className="text-center py-5 px-4 rounded-4 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div className="p-4 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex mb-4">
            <CheckCircle size={54} />
          </div>
          <h4 className="text-white fw-bold mb-2">¡Todo al día!</h4>
          <p className="text-white opacity-50 mb-0 mx-auto" style={{ maxWidth: '400px' }}>
            No hay tareas pendientes de aprobación en este momento. Todas las entregas han sido procesadas.
          </p>
        </div>
      ) : (
        <>
          <div 
            key={currentPage}
            className="row g-4 animate__animated animate__fadeIn"
          >
            {paginatedAprobaciones.map(tarea => (
                <div key={tarea.id} className="col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <div className="card-header d-flex justify-content-between border-0 py-2" style={{ background: 'rgba(250, 179, 135, 0.1)', color: 'var(--accent-color)' }}>
                    <strong className="fs-5">{tarea.cliente_nombre}</strong>
                    <span className="badge bg-warning text-dark d-flex align-items-center gap-1 shadow-sm">
                       <AlertCircle size={14} /> Esperando
                    </span>
                  </div>
                
                <div className="card-body py-3">
                  <h6 className="card-title text-white fs-6 mb-1">{tarea.titulo}</h6>
                  <p className="extreme-small mb-2" style={{ color: 'var(--text-dim)' }}>Responsables: <strong style={{ color: 'var(--text-main)' }}>{tarea.empleados}</strong></p>
                  
                    <div className="p-3 rounded mb-3 shadow-sm" style={{ background: 'var(--bg-lighter)', borderLeft: '4px solid var(--primary-color)' }}>
                      <small className="fw-bold d-block mb-2" style={{ color: 'var(--primary-color)' }}>Nota del empleado:</small>
                      <div className="small lh-lg" style={{ color: 'var(--text-main)' }}>
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
                        className="form-control form-control-sm mb-2 bg-dark text-white border-danger"
                        rows="3"
                        placeholder="Explica qué hay que corregir..."
                        style={{ backgroundColor: 'var(--bg-deep) !important', color: 'var(--text-main)' }}
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
          
          <Paginacion 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      <style>{`
        .toast-notification {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          min-width: 300px;
          border-radius: 12px;
          border: none;
        }

        .toast-notification.entering {
          animation: nebulaToastIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .toast-notification.exiting {
          animation: nebulaToastOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes nebulaToastIn {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        @keyframes nebulaToastOut {
          from { opacity: 1; transform: translate(-50%, 0); }
          to { opacity: 0; transform: translate(-50%, -20px); }
        }
      `}</style>
    </div>
  );
};

export default AprobacionesView;
