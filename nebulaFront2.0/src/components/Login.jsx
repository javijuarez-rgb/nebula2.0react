import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ user: '', pass: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(form.user, form.pass);
    if (!success) setError('Datos incorrectos. Prueba admin / admin123');
  };

  return (
    <div className="login-container" style={{
      backgroundColor: '#11111b', height: '100vh', display: 'flex', 
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="card p-4 shadow-lg" style={{ width: '320px', backgroundColor: '#1e1e2e', border: '1px solid #313244' }}>
        <h2 className="text-center mb-4" style={{ color: '#89b4fa' }}>NEBULA LOGIN</h2>
        {error && <div className="alert alert-danger py-2 small">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            className="form-control mb-3 bg-dark text-white border-secondary"
            placeholder="Usuario"
            onChange={(e) => setForm({...form, user: e.target.value})}
          />
          <input 
            type="password" 
            className="form-control mb-3 bg-dark text-white border-secondary"
            placeholder="Contraseña"
            onChange={(e) => setForm({...form, pass: e.target.value})}
          />
          <button type="submit" className="btn btn-primary w-100 fw-bold">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;