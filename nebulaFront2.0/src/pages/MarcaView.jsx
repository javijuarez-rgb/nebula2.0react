import React, { useState } from 'react';
import { MOCK_CLIENTES } from '../mocks/data';
import { Type, PaintBucket, Image as ImageIcon, Save, CheckCircle } from 'lucide-react';

const MarcaView = () => {
  const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTES[0]);

  const handleSave = () => {
    alert('Estrategia de marca guardada con éxito (Mock)');
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Estrategia de Marca</h3>
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
        <div className="col-md-4">
          <div className="card h-100 bg-dark border-secondary shadow-sm hover-shadow">
            <div className="card-header border-secondary text-primary d-flex align-items-center gap-2">
              <ImageIcon size={20} /> Logos
            </div>
            <div className="card-body">
              {selectedClient.logos.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {selectedClient.logos.map((img, i) => (
                    <img key={i} src={img} alt="Logo" className="img-thumbnail bg-secondary border-0" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                  ))}
                </div>
              ) : (
                <p className="text-muted small">No hay logos guardados.</p>
              )}
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-2" placeholder="URL del logo..." />
              <button className="btn btn-sm btn-outline-info w-100">+ Añadir Logo</button>
            </div>
          </div>
        </div>

        {/* COLORES */}
        <div className="col-md-4">
          <div className="card h-100 bg-dark border-secondary shadow-sm hover-shadow">
            <div className="card-header border-secondary text-danger d-flex align-items-center gap-2">
              <PaintBucket size={20} /> Colores
            </div>
            <div className="card-body">
              {selectedClient.colores.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {selectedClient.colores.map((color, i) => (
                    <div key={i} className="rounded-circle shadow-sm border border-secondary" style={{width: '40px', height: '40px', backgroundColor: color}} title={color}></div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small">No hay colores guardados.</p>
              )}
              <div className="d-flex gap-2">
                <input type="color" className="form-control form-control-color bg-dark border-secondary p-1" defaultValue="#89b4fa" title="Elige tu color" />
                <button className="btn btn-sm btn-outline-danger w-100">+ Añadir Color</button>
              </div>
            </div>
          </div>
        </div>

        {/* TIPOGRAFÍAS */}
        <div className="col-md-4">
          <div className="card h-100 bg-dark border-secondary shadow-sm hover-shadow">
            <div className="card-header border-secondary text-warning d-flex align-items-center gap-2">
              <Type size={20} /> Tipografías
            </div>
            <div className="card-body">
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
              <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-2" placeholder="Nombre de la fuente (ej. Roboto)" />
              <button className="btn btn-sm btn-outline-warning w-100 text-warning">+ Añadir Tipografía</button>
            </div>
          </div>
        </div>

        {/* ESTRATEGIA / SECCIÓN DE OBJETIVOS */}
        <div className="col-12 mt-4">
          <div className="card bg-dark border-secondary shadow-sm hover-shadow">
            <div className="card-header border-secondary d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-white d-flex align-items-center gap-2">
                <CheckCircle size={20} className="text-success" /> Objetivos de Estrategia
              </h5>
              <button className="btn btn-sm btn-outline-success border-0">+ Nuevo Objetivo</button>
            </div>
            <div className="card-body">
              {selectedClient.estrategias && selectedClient.estrategias.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0 align-middle">
                    <thead>
                      <tr>
                        <th className="border-secondary text-muted">Fecha</th>
                        <th className="border-secondary text-muted">Título</th>
                        <th className="border-secondary text-muted">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClient.estrategias.map(est => (
                        <tr key={est.id}>
                          <td className="border-secondary" style={{width: '120px'}}>{est.fecha}</td>
                          <td className="border-secondary text-info fw-bold">{est.titulo}</td>
                          <td className="border-secondary text-light">{est.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0 text-center py-3">No hay objetivos definidos en la estrategia actual.</p>
              )}
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR GLOBALES */}
        <div className="col-12 text-end mt-4">
          <button className="btn btn-primary fw-bold d-flex align-items-center justify-content-center gap-2 px-4 py-2 ms-auto" onClick={handleSave}>
            <Save size={20} /> Guardar Marca Completa
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarcaView;
