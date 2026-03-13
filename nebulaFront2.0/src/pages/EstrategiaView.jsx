import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_CLIENTES } from '../mocks/data';
import { ArrowLeft, Target, Calendar, ChevronRight, Zap, TrendingUp, Users, Palette, Info } from 'lucide-react';

const EstrategiaView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();

  // Si no hay clientId en la URL, podemos usar el primero o un estado local
  const [selectedClientId, setSelectedClientId] = useState(clientId ? parseInt(clientId) : MOCK_CLIENTES[0]?.id);
  const cliente = MOCK_CLIENTES.find(c => c.id === selectedClientId);

  const handleClientChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedClientId(id);
    navigate(`/estrategia/${id}`);
  };

  if (!cliente) {
    return (
      <div className="text-center py-5">
        <h4 className="text-white">Cliente no encontrado</h4>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/clientes')}>Volver a Clientes</button>
      </div>
    );
  }

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '32px', height: '32px' }}
            onClick={() => navigate('/clientes')}
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <select
          className="form-select border-0 w-auto shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', borderRadius: '10px' }}
          value={selectedClientId}
          onChange={handleClientChange}
        >
          {MOCK_CLIENTES.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className="row g-4">
        {/* COLUMNA IZQUIERDA: Marca e Identidad */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="card-header border-secondary border-opacity-10 bg-transparent p-4">
              <h5 className="text-white mb-0 d-flex align-items-center gap-2">
                <Palette className="text-primary" size={20} /> Identidad Visual
              </h5>
            </div>
            <div className="card-body p-4">
              {/* Logos */}
              <label className="small fw-bold text-white opacity-50 mb-2 uppercase tracking-wider">Logos Corporativos</label>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {cliente.logos && cliente.logos.length > 0 ? (
                  cliente.logos.map((img, i) => (
                    <img key={i} src={img} alt="LOGO" className="img-thumbnail bg-secondary border-0 p-1" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                  ))
                ) : (
                  <div className="p-3 rounded border border-secondary border-dashed text-center w-100 opacity-25">
                    <Info size={16} /> <span className="small">Sin logos</span>
                  </div>
                )}
              </div>

              {/* Colores */}
              <label className="small fw-bold text-white opacity-50 mb-2 uppercase tracking-wider">Paleta de Colores</label>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {cliente.colores && cliente.colores.length > 0 ? (
                  cliente.colores.map((color, i) => (
                    <div key={i} className="rounded-circle shadow-sm border border-secondary" style={{ width: '35px', height: '35px', backgroundColor: color }} title={color}></div>
                  ))
                ) : (
                  <div className="p-2 rounded border border-secondary border-dashed text-center w-100 opacity-25">
                    <span className="small">Sin colores</span>
                  </div>
                )}
              </div>

              {/* Tipografía */}
              <label className="small fw-bold text-white opacity-50 mb-2 uppercase tracking-wider">Tipografías</label>
              <div className="p-3 rounded border border-secondary border-opacity-10" style={{ backgroundColor: 'var(--bg-deep)' }}>
                {cliente.tipografias && cliente.tipografias.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {cliente.tipografias.map((font, i) => (
                      <li key={i} className="text-white small mb-2 d-flex align-items-center gap-2">
                        <ChevronRight size={12} className="text-primary" />
                        <span style={{ fontFamily: font }}>{font}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="small text-white opacity-25">No definidas</span>
                )}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="card-body p-4">
              <h6 className="text-secondary fw-bold mb-3 d-flex align-items-center gap-2">
                <Users size={16} /> Equipo de Cuenta
              </h6>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', fontSize: '0.8rem' }}>AD</div>
                  <div>
                    <div className="text-white small fw-bold">Admin User</div>
                    <div className="text-white opacity-50 extreme-small">Project Manager</div>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px', fontSize: '0.8rem' }}>JP</div>
                  <div>
                    <div className="text-white small fw-bold">Juan Pérez</div>
                    <div className="text-white opacity-50 extreme-small">Creative Specialist</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Planificación y Objetivos */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg mb-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="card-header border-secondary border-opacity-10 bg-transparent p-4 d-flex justify-content-between align-items-center">
              <h5 className="text-white mb-0 d-flex align-items-center gap-2">
                <Target className="text-primary" size={20} /> Objetivos Estratégicos
              </h5>
              <button className="btn btn-primary btn-sm fw-bold px-3">+ Nuevo Objetivo</button>
            </div>
            <div className="card-body p-4">
              {cliente.estrategias && cliente.estrategias.length > 0 ? (
                <div className="timeline">
                  {cliente.estrategias.map((est, index) => (
                    <div key={est.id} className="mb-4 ps-4 position-relative border-start border-primary border-2">
                      <div className="position-absolute start-0 top-0 translate-middle-x bg-primary rounded-circle" style={{ width: '12px', height: '12px', marginLeft: '-1px' }}></div>
                      <div className="card bg-dark bg-opacity-25 border-secondary border-opacity-10 p-3 shadow-sm">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="text-white fw-bold mb-0">{est.titulo}</h6>
                          <span className="badge bg-dark text-primary border border-primary border-opacity-25 small">
                            <Calendar size={12} className="me-1" /> {est.fecha}
                          </span>
                        </div>
                        <p className="text-white opacity-50 small mb-0">{est.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 opacity-50">
                  <TrendingUp size={48} className="mb-3 text-primary" />
                  <p className="text-white">No hay estrategias definidas para este cliente.</p>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="card-body p-4">
              <h6 className="text-primary fw-bold mb-3 d-flex align-items-center gap-2">
                <Zap size={16} /> Panel de Acción
              </h6>
              <div className="row g-2">
                <div className="col-md-4">
                  <button className="btn btn-dark w-100 text-start text-white border-secondary border-opacity-10 p-3 d-flex flex-column gap-2 hover-lift">
                    <TrendingUp size={20} className="text-success" />
                    <span className="small fw-bold">Informe SEO</span>
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-dark w-100 text-start text-white border-secondary border-opacity-10 p-3 d-flex flex-column gap-2 hover-lift">
                    <Users size={20} className="text-info" />
                    <span className="small fw-bold">Ads Mensual</span>
                  </button>
                </div>
                <div className="col-md-4">
                  <button className="btn btn-dark w-100 text-start text-white border-secondary border-opacity-10 p-3 d-flex flex-column gap-2 hover-lift">
                    <Target size={20} className="text-warning" />
                    <span className="small fw-bold">Competencia</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .extreme-small { font-size: 0.75rem; }
        .hover-lift:hover { transform: translateY(-3px); transition: 0.2s; background-color: var(--bg-deep) !important; }
        .border-dashed { border-style: dashed !important; }
      `}</style>
    </div>
  );
};

export default EstrategiaView;
