import React, { useState } from "react";
import { User, Clock, AlertCircle, CheckCircle2, Pencil } from "lucide-react";

const TablaTareas = ({ tareas, user, onEditTask }) => {
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const canEdit = user && (user.role === 'admin' || user.role === 'superadmin');

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'proceso':
        return <span className="badge bg-info-subtle text-info d-flex align-items-center gap-1 w-fit"><Clock size={12}/> EN PROCESO</span>;
      case 'espera_aprobacion':
        return <span className="badge bg-warning-subtle text-warning d-flex align-items-center gap-1 w-fit"><AlertCircle size={12}/> ESPERANDO</span>;
      case 'terminada':
        return <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1 w-fit"><CheckCircle2 size={12}/> TERMINADA</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary d-flex align-items-center gap-1 w-fit">PENDIENTE</span>;
    }
  };

  return (
    <div className="table-responsive" style={{ backgroundColor: "var(--bg-card)", borderRadius: "15px", padding: "0", border: "1px solid var(--border-color)", overflow: 'visible' }}>
      <table className="table table-hover align-middle mb-0">
        <thead className="bg-deep">
          <tr>
            <th className="ps-4 py-3">Cliente</th>
            <th>Tarea</th>
            <th>Asignado</th>
            <th>Estado</th>
            <th>Límite</th>
            {canEdit && <th className="pe-4 text-end">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {tareas.map((tarea) => {
            const isExpanded = expandedTaskId === tarea.id;
            return (
              <tr 
                key={tarea.id} 
                className={`border-secondary border-opacity-10 transition-all cursor-pointer ${isExpanded ? 'bg-white bg-opacity-5' : ''}`}
                onClick={() => setExpandedTaskId(tarea.id)}
                onMouseLeave={() => setExpandedTaskId(null)}
                style={{ verticalAlign: 'top' }}
              >
                <td className="ps-4 py-3">
                  <span className="fw-bold text-white d-block mt-1">{tarea.cliente_nombre}</span>
                </td>
                <td className="py-3">
                  <div className="d-flex flex-column">
                    <span className="text-white fw-medium mt-1">{tarea.titulo}</span>
                    <div className={`description-wrapper ${isExpanded ? 'expanded' : ''}`}>
                      <small className="text-white opacity-50 lh-sm">
                        {tarea.descripcion}
                      </small>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <div className="p-1.5 rounded-circle bg-dark border border-secondary border-opacity-25 text-white opacity-75 d-flex">
                      <User size={14} />
                    </div>
                    <span className="small text-white opacity-75">{tarea.empleados}</span>
                  </div>
                </td>
                <td className="py-3">
                  <div className="mt-1">
                    {getStatusBadge(tarea.estado)}
                  </div>
                </td>
                <td className="py-3">
                  <div className="mt-1">
                    <code className="small text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                      {tarea.fecha_limite.split(' ')[0]}
                    </code>
                  </div>
                </td>
                {canEdit && (
                  <td className="pe-4 py-3 text-end">
                    <button 
                      className="btn btn-sm btn-outline-primary border-0 p-2 hover-bg-primary mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(tarea);
                      }}
                      title="Editar Tarea"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <style>{`
        .w-fit { width: fit-content; }
        .table-hover tbody tr:hover { background-color: rgba(255,255,255, 0.02) !important; }
        .description-wrapper {
          max-height: 1.25rem;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .description-wrapper:not(.expanded) small {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .description-wrapper.expanded {
          max-height: 200px;
        }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

export default TablaTareas;
