import React, { useState, useMemo } from "react";
import { useTareas } from "../hooks/useTareas";
import { MOCK_CLIENTES } from "../mocks/data";
import StatCard from "../components/StatCard";
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Users,
  Calendar,
  Check,
  X
} from "lucide-react";
import Paginacion from "../components/Paginacion";

const StatsView = () => {
  const { tareas, cargando } = useTareas();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Cálculos globales
  const statsGlobales = useMemo(() => {
    const total = tareas.length;
    const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
    const terminadas = tareas.filter(t => t.estado === 'terminada' || t.estado === 'aprobada').length;
    const proceso = tareas.filter(t => t.estado === 'proceso').length;
    
    return { total, pendientes, terminadas, proceso };
  }, [tareas]);

  // Cálculos por cliente
  const statsPorCliente = useMemo(() => {
    return MOCK_CLIENTES.map(cliente => {
      const tareasCliente = tareas.filter(t => t.cliente_id === cliente.id);
      
      const counts = {
        pendiente: tareasCliente.filter(t => t.estado === 'pendiente').length,
        proceso: tareasCliente.filter(t => t.estado === 'proceso').length,
        terminada: tareasCliente.filter(t => t.estado === 'terminada' || t.estado === 'aprobada').length,
      };

      // Simulación de aprobaciones/rechazos basada en el mensaje_jefe o logs (aquí simplificado)
      // En el PHP original se sacaba de logs. Aquí usaremos un ratio basado en el ID para simular realismo
      const aprobadas = Math.floor(counts.terminada * 0.8) + (cliente.id % 2);
      const rechazadas = Math.max(0, counts.terminada - aprobadas);
      const totalRev = aprobadas + rechazadas;
      const pctAprob = totalRev > 0 ? Math.round((aprobadas / totalRev) * 100) : 0;

      // Tiempo medio simulado
      const mediaSimulada = counts.terminada > 0 ? `${2 + (cliente.id % 3)}d ${4 + (cliente.id % 8)}h` : "--";

      return {
        ...cliente,
        counts,
        aprobadas,
        rechazadas,
        pctAprob,
        mediaSimulada
      };
    });
  }, [tareas]);

  // Paginated items
  const paginatedStats = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return statsPorCliente.slice(startIndex, startIndex + itemsPerPage);
  }, [statsPorCliente, currentPage]);

  const totalPages = Math.ceil(statsPorCliente.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Optional: scroll to top of stats section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (cargando) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn">
      {/* Resumen Global */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard
            title="Total Tareas"
            value={statsGlobales.total}
            color="var(--primary-color)"
            icon={<BarChart3 size={20} />}
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Pendientes"
            value={statsGlobales.pendientes}
            color="var(--warning-color)"
            icon={<Clock size={20} />}
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="En Proceso"
            value={statsGlobales.proceso}
            color="var(--info-color)"
            icon={<AlertCircle size={20} />}
          />
        </div>
        <div className="col-md-3">
          <StatCard
            title="Completadas"
            value={statsGlobales.terminadas}
            color="var(--success-color)"
            icon={<CheckCircle2 size={20} />}
          />
        </div>
      </div>

      <h4 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
        <TrendingUp className="text-primary" /> Rendimiento por Cliente
      </h4>

      <div 
        key={currentPage} 
        className="row g-4 animate__animated animate__fadeIn"
      >
        {paginatedStats.map((cliente, index) => (
          <div key={cliente.id} className={`col-md-4 animate__animated animate__fadeInUp`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div 
              className="card h-100 border-0 shadow-sm"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderRadius: '1.25rem',
                overflow: 'hidden'
              }}
            >
              <div 
                className="px-4 py-3 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center"
                style={{ backgroundColor: 'rgba(137, 180, 250, 0.05)' }}
              >
                <h6 className="text-primary fw-bold mb-0">{cliente.nombre}</h6>
                <Users size={16} className="text-primary opacity-50" />
              </div>
              
              <div className="card-body p-4">
                {/* Desglose de Tareas */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white opacity-75 small">Pendientes</span>
                    <span className="badge rounded-pill bg-warning text-dark">{cliente.counts.pendiente}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-white opacity-75 small">En Proceso</span>
                    <span className="badge rounded-pill bg-info text-dark">{cliente.counts.proceso}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-white opacity-75 small">Hechas</span>
                    <span className="badge rounded-pill bg-success text-white">{cliente.counts.terminada}</span>
                  </div>
                </div>

                {/* Tasa de Aprobación */}
                <div className="mb-4 p-3 rounded-4" style={{ backgroundColor: 'var(--bg-deep)' }}>
                  <label className="text-white opacity-75 extreme-small fw-bold text-uppercase tracking-wider mb-2 d-block text-center">
                    Tasa de Aprobación
                  </label>
                  <div className="d-flex justify-content-between text-center fw-bold small mb-2">
                    <span className="d-flex align-items-center gap-1" style={{ color: 'var(--success-color)' }}>
                      <Check size={14} /> {cliente.aprobadas}
                    </span>
                    <span className="d-flex align-items-center gap-1" style={{ color: 'var(--danger-color)' }}>
                      <X size={14} /> {cliente.rechazadas}
                    </span>
                  </div>
                  <div className="progress overflow-visible" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                    <div 
                      className="progress-bar bg-success shadow-sm" 
                      style={{ 
                        width: `${cliente.pctAprob}%`,
                        borderRadius: '10px',
                        transition: 'width 1s ease-in-out'
                      }}
                    ></div>
                    <div 
                      className="progress-bar bg-danger shadow-sm" 
                      style={{ 
                        width: `${100 - cliente.pctAprob}%`,
                        borderRadius: '10px',
                        transition: 'width 1s ease-in-out'
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-white fw-bold small">{cliente.pctAprob}% de éxito</span>
                  </div>
                </div>

                {/* Tiempo Medio */}
                <div 
                  className="p-3 rounded-4 border border-light border-opacity-10"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Calendar size={14} className="text-white" />
                    <span className="text-white opacity-75 extreme-small fw-bold text-uppercase tracking-wider">
                      Tiempo Medio Resol.
                    </span>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <input 
                      type="month" 
                      className="form-control form-control-sm border-0 text-white p-0 bg-transparent custom-month-input"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{ fontSize: '0.85rem', cursor: 'pointer' }}
                    />
                    <div className="ms-auto text-primary fw-bold">
                      {cliente.mediaSimulada}
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default StatsView;
