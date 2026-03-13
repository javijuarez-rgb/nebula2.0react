import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto py-4 text-center border-top border-secondary border-opacity-10" style={{ backgroundColor: 'var(--bg-deep)', backdropFilter: 'blur(10px)' }}>
      <div className="container">
        <div className="d-flex flex-column align-items-center gap-2">
          <div className="fw-bold tracking-widest text-white opacity-75" style={{ fontSize: '0.9rem', letterSpacing: '2px' }}>
            NEBULA <span className="text-primary">2.0</span>
          </div>
          <span className="text-white opacity-50 small">
            © {new Date().getFullYear()} — Todos los derechos reservados · <span className="fst-italic">Premium Dashboard System</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
