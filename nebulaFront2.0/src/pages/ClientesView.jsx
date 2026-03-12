import React, { useState } from 'react';
import { MOCK_CLIENTES } from '../mocks/data';
import { Search, UserPlus, Phone, MapPin, BadgeCheck } from 'lucide-react';

const ClientesView = () => {
  const [busqueda, setBusqueda] = useState('');
  
  // Filtramos en tiempo real (Sustituye a la lógica de búsqueda de tu PHP)
  const clientesFiltrados = MOCK_CLIENTES.filter(c => 
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">Gestión de Clientes</h3>
        <button className="btn btn-primary d-flex align-items-center gap-2">
          <UserPlus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Buscador inteligente */}
      <div className="input-group mb-4 shadow-sm">
        <span className="input-group-text bg-dark border-secondary text-muted">
          <Search size={18} />
        </span>
        <input 
          type="text" 
          className="form-control bg-dark text-white border-secondary" 
          placeholder="Buscar por nombre, teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="row g-3">
        {clientesFiltrados.map(cliente => (
          <div key={cliente.id} className="col-md-6 col-lg-4">
            <div className="card h-100 bg-dark border-secondary hover-shadow" style={{ transition: '0.3s' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <h5 className="card-title text-info mb-0">{cliente.nombre}</h5>
                  <span className={`badge ${cliente.es_activo ? 'bg-success' : 'bg-secondary'}`}>
                    {cliente.es_activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                
                <div className="small text-muted mb-3">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Phone size={14} /> {cliente.telefono}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={14} /> {cliente.direccion || 'Sin ubicación'}
                  </div>
                </div>

                {cliente.es_potencial === 1 && (
                  <div className="alert alert-warning p-1 px-2 small border-0 d-flex align-items-center gap-2">
                    <BadgeCheck size={14} /> Cliente Potencial
                  </div>
                )}

                <div className="d-flex gap-2 mt-auto">
                  <button className="btn btn-sm btn-outline-secondary w-100">Editar</button>
                  <button className="btn btn-sm btn-outline-info w-100">Estrategia</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientesView;