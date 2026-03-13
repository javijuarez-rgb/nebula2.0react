import React, { useState } from 'react';
import { MOCK_CLIENTES } from '../mocks/data';
import { DollarSign, Plus, Save, Trash2, Tag } from 'lucide-react';

const MOCK_CATALOGO_INGRESOS = [
  { id: 1, nombre: 'Gestión Redes SEO', precio_defecto: 350 },
  { id: 2, nombre: 'Campaña SEM', precio_defecto: 150 },
  { id: 3, nombre: 'Diseño Web', precio_defecto: 1200 }
];

const MOCK_CATALOGO_COSTES = [
  { id: 1, nombre: 'Hosting y Dominio', precio_defecto: 120 },
  { id: 2, nombre: 'Publicidad FB Ads', precio_defecto: 100 },
  { id: 3, nombre: 'Licencia Software', precio_defecto: 50 }
];

const FinanzasView = () => {
  const [activeTab, setActiveTab] = useState('budget');
  
  // Tabla de gastos libres
  const [gastos, setGastos] = useState([
    { id: 1, concepto: 'Hosting anual', precio: 120, tiene_iva: true }
  ]);

  const handleAddGasto = () => {
    setGastos([...gastos, { id: Date.now(), concepto: '', precio: 0, tiene_iva: false }]);
  };

  const handleRemoveGasto = (id) => {
    setGastos(gastos.filter(g => g.id !== id));
  };

  const handleGastoChange = (id, field, value) => {
    setGastos(gastos.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="btn-group">
          <button 
            className={`btn ${activeTab === 'budget' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveTab('budget')}
          >
            Budget (Presupuesto)
          </button>
          <button 
            className={`btn ${activeTab === 'real' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setActiveTab('real')}
          >
            Real (Facturación)
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* TABLA DE INGRESOS (CLIENTES) */}
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center bg-transparent py-3">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <DollarSign size={20} className="text-success" />
                Ingresos por Cliente ({activeTab.toUpperCase()})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Base (€)</th>
                      <th>Extra 1</th>
                      <th>Extra 2</th>
                      <th className="text-end">Total C/IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_CLIENTES.map(cliente => (
                      <tr key={cliente.id}>
                        <td><strong style={{ color: 'var(--primary-color)' }}>{cliente.nombre}</strong></td>
                        <td>
                          <input type="number" className="form-control form-control-sm" defaultValue="0" />
                        </td>
                        <td>
                           <select className="form-select form-select-sm">
                              <option value="">-- Catálogo --</option>
                              {MOCK_CATALOGO_INGRESOS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                           </select>
                        </td>
                        <td>
                           <select className="form-select form-select-sm">
                              <option value="">-- Catálogo --</option>
                              {MOCK_CATALOGO_INGRESOS.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                           </select>
                        </td>
                        <td className="text-end fw-bold" style={{ color: 'var(--secondary-color)' }}>
                          0.00€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE COSTES / GASTOS LIBRES */}
        <div className="col-12">
          <div className="card border-0 shadow-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="card-header border-0 d-flex justify-content-between align-items-center bg-transparent py-3">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ color: 'var(--text-main)' }}>
                <Tag size={20} className="text-danger" />
                Gastos Libres ({activeTab.toUpperCase()})
              </h5>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-sm" onClick={handleAddGasto}>
                <Plus size={16} /> Añadir Fila
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Concepto del Gasto</th>
                      <th style={{width: '150px'}}>Precio (€)</th>
                      <th className="text-center" style={{width: '100px'}}>+ IVA</th>
                      <th className="text-end" style={{width: '120px'}}>Eliminar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map(g => (
                      <tr key={g.id}>
                        <td>
                          <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            placeholder="Concepto..." 
                            value={g.concepto}
                            onChange={(e) => handleGastoChange(g.id, 'concepto', e.target.value)}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="form-control form-control-sm text-end" 
                            value={g.precio}
                            onChange={(e) => handleGastoChange(g.id, 'precio', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            className="form-check-input" 
                            checked={g.tiene_iva}
                            onChange={(e) => handleGastoChange(g.id, 'tiene_iva', e.target.checked)}
                          />
                        </td>
                        <td className="border-secondary text-end">
                          <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleRemoveGasto(g.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer border-secondary text-end bg-transparent">
              <button className="btn btn-success fw-bold d-flex align-items-center gap-2 ms-auto">
                <Save size={18} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanzasView;
