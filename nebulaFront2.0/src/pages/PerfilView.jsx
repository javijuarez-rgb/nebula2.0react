import React from 'react';
import { User, Mail, Shield, Calendar, Award, Edit3, Key } from 'lucide-react';

const PerfilView = ({ user }) => {
  if (!user) return null;

  return (
    <div className="container-fluid animate__animated animate__fadeIn">
      {/* Header section with cover effect */}
      <div 
        className="row mb-5 position-relative rounded-4 overflow-hidden shadow-lg mx-0"
        style={{ 
          height: '220px', 
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-deep) 100%)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25" 
             style={{ 
               backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")',
               pointerEvents: 'none'
             }}></div>
        
        <div className="col-12 d-flex align-items-end p-4 position-relative">
          <div className="d-flex align-items-center gap-4">
            <div 
              className="rounded-circle p-1 bg-primary shadow-lg position-relative"
              style={{ width: '120px', height: '120px', marginTop: '60px' }}
            >
              <div className="w-100 h-100 rounded-circle bg-dark d-flex align-items-center justify-content-center border border-3 border-dark overflow-hidden">
                <User size={64} className="text-primary opacity-75" />
              </div>
              <div className="position-absolute bottom-0 end-0 bg-success border border-2 border-dark rounded-circle" 
                   style={{ width: '24px', height: '24px' }}></div>
            </div>
            
            <div className="mt-4 pt-4">
              <h2 className="text-white fw-bold mb-1">{user.name}</h2>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary border border-primary border-opacity-25 px-3 py-1 rounded-pill">
                  {user.role === 'superadmin' ? 'Super Administrador' : user.role}
                </span>
                <span className="text-white opacity-50 small d-flex align-items-center gap-1">
                  <Calendar size={14} /> Miembro desde {user.created_at}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column - Main Info */}
        <div className="col-lg-8">
          <div className="card h-100 border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-10">
                <h5 className="text-white fw-bold mb-0 d-flex align-items-center gap-2">
                  <Award size={20} className="text-primary" /> Información de la Cuenta
                </h5>
                <button className="btn btn-sm btn-outline-primary border-0 rounded-pill px-3 d-flex align-items-center gap-2 hover-bg-primary">
                  <Edit3 size={16} /> Editar Perfil
                </button>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-3 rounded-4 border border-white border-opacity-5" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                    <label className="small text-primary opacity-75 fw-bold text-uppercase mb-2 d-block">Nombre Completo</label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                        <User size={20} />
                      </div>
                      <span className="text-white fw-medium">{user.name}</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 rounded-4 border border-white border-opacity-5" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                    <label className="small text-primary opacity-75 fw-bold text-uppercase mb-2 d-block">Nombre de Usuario</label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded-3 bg-info bg-opacity-10 text-info">
                        <Award size={20} />
                      </div>
                      <span className="text-white fw-medium">@{user.username}</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 rounded-4 border border-white border-opacity-5" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                    <label className="small text-primary opacity-75 fw-bold text-uppercase mb-2 d-block">Nivel de Acceso</label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
                        <Shield size={20} />
                      </div>
                      <span className="text-white fw-medium text-capitalize">{user.role}</span>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 rounded-4 border border-white border-opacity-5" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                    <label className="small text-primary opacity-75 fw-bold text-uppercase mb-2 d-block">Seguridad</label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded-3 bg-warning bg-opacity-10 text-warning">
                        <Key size={20} />
                      </div>
                      <span className="text-white fw-medium">PIN de Seguridad Activado</span>
                    </div>
                  </div>
                </div>

                <div className="col-12 mt-4">
                  <div className="p-4 rounded-4" style={{ background: 'rgba(137, 180, 250, 0.05)', border: '1px dashed rgba(137, 180, 250, 0.2)' }}>
                    <div className="d-flex align-items-start gap-3">
                      <Award className="text-primary mt-1" size={24} />
                      <div>
                        <h6 className="text-white fw-bold mb-1">Insignia Premuim</h6>
                        <p className="text-white opacity-50 small mb-0">Tienes acceso a todas las herramientas avanzadas de Nebula 2.0. Gracias por formar parte de nuestro equipo de administración.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Secondary Info / Stats */}
        <div className="col-lg-4">
          <div className="card border-0 mb-4" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div className="card-body p-4">
              <h5 className="text-white fw-bold mb-4">Actividad Reciente</h5>
              <div className="d-flex flex-column gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="d-flex gap-3 position-relative">
                    {i !== 3 && <div className="position-absolute start-0 top-0 mt-4 ms-2 h-100 border-start border-secondary border-opacity-25" style={{ left: '10px' }}></div>}
                    <div className="flex-shrink-0 z-1">
                      <div className="rounded-circle bg-primary bg-opacity-20 p-1">
                        <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-white small mb-1">Inicio de sesión correcto</p>
                      <p className="text-white opacity-25 tiny mb-0">Hace {i * 2} horas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card border-0" style={{ backgroundColor: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <div className="card-body p-4 text-center">
              <div className="mb-3 d-inline-block p-3 rounded-circle bg-danger bg-opacity-10 text-danger">
                <Shield size={32} />
              </div>
              <h6 className="text-white fw-bold mb-2 text-primary">Zona de Peligro</h6>
              <p className="text-white opacity-50 small mb-4">Solo para casos de emergencia o desactivación de cuenta.</p>
              <button className="btn btn-outline-danger w-100 rounded-pill fw-bold">Deshabilitar Cuenta</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tiny { font-size: 0.7rem; }
        .hover-bg-primary:hover { background-color: var(--primary-color) !important; color: white !important; }
        .animate-pulse-slow { animation: pulse 4s infinite ease-in-out; }
        @keyframes pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default PerfilView;
