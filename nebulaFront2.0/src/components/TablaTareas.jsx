import React from "react";

const TablaTareas = ({ tareas }) => {
  return (
    <div
      className="table-responsive"
      style={{
        backgroundColor: "var(--bg-card)",
        borderRadius: "8px",
        padding: "1rem",
        border: "1px solid var(--border-color)"
      }}
    >
      <table className="table table-hover">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tarea</th>
            <th>Estado</th>
            <th>Límite</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map((tarea) => (
            <tr key={tarea.id}>
              <td>{tarea.cliente_nombre}</td>
              <td>
                <div className="fw-bold">{tarea.titulo}</div>
                <small style={{ color: 'var(--text-dim)' }}>{tarea.descripcion}</small>
              </td>
              <td>
                <span
                  className={`badge bg-${tarea.estado === "proceso" ? "info" : "warning"} text-dark`}
                >
                  {tarea.estado.toUpperCase()}
                </span>
              </td>
              <td>{tarea.fecha_limite}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaTareas;
