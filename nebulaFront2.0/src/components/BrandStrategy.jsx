import React, { useState } from 'react';

const BrandStrategy = ({ cliente }) => {
  // Inicializamos con los datos del cliente (o vacíos si es nuevo)
  const [colores, setColores] = useState(cliente?.colores || ['#000000', '#000000']);
  const [logos, setLogos] = useState(cliente?.logos || ['', '']);

  const handleColorChange = (index, newColor) => {
    const updated = [...colores];
    updated[index] = newColor;
    setColores(updated);
  };

  return (
    <div className="card bg-dark border-secondary p-4">
      <h4 className="text-info mb-4">Estrategia de Marca: {cliente?.nombre}</h4>
      
      <div className="row">
        {/* Sección de Logos */}
        <div className="col-md-6 mb-4">
          <label className="text-muted small fw-bold mb-2">LOGOTIPOS (URLs)</label>
          {logos.map((logo, idx) => (
            <input 
              key={idx}
              type="text" 
              className="form-control mb-2 bg-dark text-white border-secondary"
              placeholder={`URL Logo ${idx + 1}`}
              value={logo}
              onChange={(e) => {
                const newLogos = [...logos];
                newLogos[idx] = e.target.value;
                setLogos(newLogos);
              }}
            />
          ))}
        </div>

        {/* Sección de Colores */}
        <div className="col-md-6 mb-4">
          <label className="text-muted small fw-bold mb-2">COLORES CORPORATIVOS</label>
          <div className="d-flex gap-3">
            {colores.map((color, idx) => (
              <div key={idx} className="text-center">
                <input 
                  type="color" 
                  className="form-control form-control-color bg-transparent border-0"
                  value={color}
                  onChange={(e) => handleColorChange(idx, e.target.value)}
                />
                <code className="d-block mt-1 small" style={{ color: color }}>{color}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-outline-success mt-3 fw-bold">
        Guardar Estrategia
      </button>
    </div>
  );
};

export default BrandStrategy;