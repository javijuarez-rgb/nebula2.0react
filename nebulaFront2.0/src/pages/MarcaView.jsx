import React, { useState } from 'react';
import { MOCK_CLIENTES } from '../mocks/data';


const MarcaView = () => {
  const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTES[0]);

  const handleSave = () => {
    alert('Estrategia de marca guardada con éxito (Mock)');
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 style={{ color: "var(--primary-pastel)", margin: 0 }}>Cliente</h3>
        <select 
          className="form-select bg-dark text-white border-secondary w-auto"
          value={selectedClient.id}
          onChange={(e) => setSelectedClient(MOCK_CLIENTES.find(c => c.id === parseInt(e.target.value)))}
        >
          {MOCK_CLIENTES.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="row g-4">
        {/* LOGOS */}
        <div className="col-md-6">
          <div className="card h-100 bg-dark border-secondary shadow-sm hover-shadow" style={{ backgroundColor: '#1e1e2e', borderColor: '#45475a' }}>
            <div className="card-header border-secondary d-flex justify-content-between align-items-center py-3" style={{ background: 'transparent' }}>
               <h6 className="fw-bold mb-0 text-muted">Identidad Visual</h6>
            </div>
            <div className="card-body">
              <label className="small fw-bold text-muted mb-2">Logos (URLs)</label>
              {selectedClient.logos.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {selectedClient.logos.map((img, i) => (
                    <img key={i} src={img} alt="Logo" className="img-thumbnail bg-secondary border-0" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                  ))}
                </div>
              ) : (
                <p className="text-muted small">No hay logos guardados.</p>
              )}
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-2" placeholder="URL Logo Principal" />
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-2" placeholder="URL Logo Secundario" />
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-2" placeholder="URL Logo Alternativo" />

              <hr className="border-secondary my-3" />
              
              <label className="small fw-bold text-muted mb-2">Colores Corporativos</label>
              {selectedClient.colores.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {selectedClient.colores.map((color, i) => (
                    <div key={i} className="rounded-circle shadow-sm border border-secondary" style={{width: '40px', height: '40px', backgroundColor: color}} title={color}></div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small">No hay colores guardados.</p>
              )}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="d-flex gap-2 mb-1 align-items-center">
                  <input type="color" className="form-control form-control-color bg-dark border-secondary p-1" defaultValue="#000000" />
                  <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary" placeholder="#000000" />
                </div>
              ))}
              
              <hr className="border-secondary my-3" />

              <label className="small fw-bold text-muted mb-2">Tipografías</label>
              {selectedClient.tipografias.length > 0 ? (
                <ul className="list-group list-group-flush mb-3">
                  {selectedClient.tipografias.map((font, i) => (
                    <li key={i} className="list-group-item bg-transparent text-white border-secondary px-0">
                      <span style={{fontFamily: font}}>{font}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted small">No hay tipografías guardadas.</p>
              )}
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-1" placeholder="Ej: Montserrat (Títulos)" />
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-1" placeholder="Ej: Open Sans (Cuerpo)" />
            </div>
          </div>
        </div>

        {/* NUEVA ESTRATEGIA */}
        <div className="col-md-6">
          <div className="card p-3 mb-3 bg-dark border-secondary shadow-sm">
            <h6 className="fw-bold" style={{ color: "var(--primary-pastel)" }}>Nueva Estrategia</h6>
            <select className="form-select form-select-sm mb-2 bg-dark text-white border-secondary">
              <option value="mensual">Objetivo Mensual</option>
              <option value="evento">Evento Especial</option>
            </select>
            <input type="text" className="form-control form-control-sm mb-2 bg-dark text-white border-secondary" placeholder="Título" />
            <input type="date" className="form-control form-control-sm mb-2 bg-dark text-white border-secondary" />
            <textarea className="form-control form-control-sm mb-2 bg-dark text-white border-secondary" rows="4" placeholder="Detalles de la estrategia..."></textarea>
          </div>
        </div>

        {/* HISTORIAL */}
        <div className="col-12 mt-4">
          <h6 className="border-bottom pb-2 border-secondary text-muted">Historial de Estrategia</h6>
          <div className="table-responsive card p-0 mb-3 bg-dark border-secondary">
            <table className="table table-sm table-dark table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th className="border-secondary text-muted">Fecha</th>
                  <th className="border-secondary text-muted">Tipo</th>
                  <th className="border-secondary text-muted">Título</th>
                  <th className="border-secondary text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {selectedClient.estrategias && selectedClient.estrategias.length > 0 ? (
                  selectedClient.estrategias.map(est => (
                    <tr key={est.id}>
                      <td className="border-secondary">{est.fecha}</td>
                      <td className="border-secondary text-light">Mensual</td>
                      <td className="border-secondary fw-bold" style={{ color: "var(--primary-pastel)" }}>{est.titulo}</td>
                      <td className="border-secondary text-end">
                        <button className="btn btn-sm btn-outline-danger border-0">Borrar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-muted text-center py-3">No hay objetivos definidos en la estrategia actual.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* BOTÓN GUARDAR GLOBALES */}
        <div className="col-12 text-end mt-2">
          <button className="btn btn-success fw-bold px-4 py-2 w-100" onClick={handleSave}>
            Guardar Estrategia de Marca
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarcaView;
