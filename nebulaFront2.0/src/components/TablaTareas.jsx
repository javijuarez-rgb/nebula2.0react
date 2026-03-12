import React from "react";

const TablaTareas = ({ tareas }) => {
  return (
    <div
      className="table-responsive"
      style={{
        backgroundColor: "#1e1e2e",
        borderRadius: "8px",
        padding: "1rem",
      }}
    >
      <table className="table table-dark table-hover mb-0">
        <thead>
          <tr style={{ color: "#89b4fa" }}>
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
                <small className="text-muted">{tarea.descripcion}</small>
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
