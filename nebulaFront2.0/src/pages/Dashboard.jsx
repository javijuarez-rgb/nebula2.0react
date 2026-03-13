// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import { User, LogOut, ChevronDown } from "lucide-react";

const Dashboard = ({ user }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname.split("/")[1];
    switch (path) {
      case "stats": return "Estadísticas";
      case "tareas": return "Gestión de Tareas";
      case "calendario": return "Calendario";
      case "chat": return "Centro de Mensajes";
      case "clientes": return "Gestión de Clientes";
      case "aprobaciones": return "Aprobaciones";
      case "finanzas": return "Control Financiero";
      case "estrategia": return "Estrategia";
      case "equipo": return "Mi Equipo";
      case "perfil": return "Perfil de Usuario";
      default: return "Panel de Control";
    }
  };

  const getPageSubtitle = () => {
    const path = location.pathname.split("/")[1];
    switch (path) {
      case "stats": return "Visualiza el rendimiento y métricas clave de la plataforma.";
      case "tareas": return "Organiza, filtra y gestiona el flujo de trabajo diario.";
      case "calendario": return "Planificación temporal y eventos programados.";
      case "chat": return "Comunicación directa con el equipo y clientes.";
      case "clientes": return "Directorio completo y gestión de relaciones comerciales.";
      case "aprobaciones": return "Revisión y validación de tareas pendientes de confirmar.";
      case "finanzas": return "Seguimiento de presupuestos, gastos e ingresos.";
      case "estrategia": return "Definición de objetivos y plan de marca.";
      case "equipo": return "Gestión de miembros, roles y accesos.";
      case "perfil": return "Configuración de tu cuenta y preferencias personales.";
      default: return "Panel central de administración.";
    }
  };

  return (
    <div
      className="d-flex w-100"
      style={{ height: "100vh", backgroundColor: "var(--bg-deep)", width: "100vw", overflow: "hidden" }}
    >
      <Sidebar />

      <div className="flex-grow-1 p-4 d-flex flex-column" style={{ minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <header className="mb-4 d-flex justify-content-between align-items-center">
          <div key={location.pathname} className="animate__animated animate__fadeIn">
            <h2 className="text-white fw-bold mb-0">{getPageTitle()}</h2>
            <p className="text-white opacity-50 small mb-0">{getPageSubtitle()}</p>
          </div>
          
          <div className="position-relative">
            <button 
              className={`btn d-flex align-items-center gap-2 border-0 px-3 py-2 rounded-4 transition-all`}
              style={{ 
                backgroundColor: showDropdown ? 'rgba(137, 180, 250, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => setShowDropdown(!showDropdown)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            >
              <div className="p-1.5 rounded-circle bg-primary bg-opacity-20 text-primary d-flex shadow-sm">
                <User size={20} />
              </div>
              <div className="text-start d-none d-md-block me-1">
                <p className="text-white small fw-bold mb-0 lh-1">{user.username || user.name}</p>
                <p className="text-white opacity-50 extreme-small mb-0 text-uppercase tracking-wider">{user.role}</p>
              </div>
              <ChevronDown size={14} className={`text-white opacity-50 transition-all ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div 
                className="position-absolute end-0 mt-2 p-2 rounded-4 shadow-lg animate__animated animate__fadeInUp animate__faster"
                style={{ 
                  width: '240px', 
                  backgroundColor: 'rgba(26, 27, 38, 0.95)', 
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--border-color)',
                  zIndex: 1050
                }}
              >
                <div className="px-3 py-2 border-bottom border-secondary border-opacity-10 mb-1">
                  <p className="text-white small fw-bold mb-0">{user.name}</p>
                  <p className="text-white opacity-50 extreme-small mb-0">{user.role === 'superadmin' ? 'Super Administrador' : user.role}</p>
                </div>
                
                <Link 
                  to="/perfil" 
                  className="dropdown-item d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-white opacity-75 hover-opacity-100 transition-all"
                  style={{ backgroundColor: 'transparent' }}
                >
                  <div className="p-1.5 rounded-3 bg-primary bg-opacity-10 text-primary">
                    <User size={16} />
                  </div>
                  <span className="small fw-medium">Ver Perfil</span>
                </Link>

                <button 
                  className="dropdown-item d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-danger opacity-75 hover-opacity-100 transition-all mt-1 w-100 border-0"
                  style={{ backgroundColor: 'transparent' }}
                  onClick={() => window.location.reload()}
                >
                  <div className="p-1.5 rounded-3 bg-danger bg-opacity-10 text-danger text-start">
                    <LogOut size={16} />
                  </div>
                  <span className="small fw-medium">Salir</span>
                </button>
              </div>
            )}
          </div>
        </header>
        
        <div className="flex-grow-1 position-relative">
          <div 
            key={location.pathname}
            className="animate__animated animate__fadeIn h-100"
          >
            <Outlet />
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
