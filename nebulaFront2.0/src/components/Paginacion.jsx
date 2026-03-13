import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Paginacion = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav className="d-flex justify-content-center mt-4 animate__animated animate__fadeInUp">
      <ul className="pagination gap-2 border-0">
        <li className={`page-item ${currentPage === 1 ? 'disabled opacity-25' : ''}`}>
          <button 
            className="page-link rounded-circle border-0 d-flex align-items-center justify-content-center" 
            style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--primary-color)' 
            }}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} />
          </button>
        </li>
        
        {pages.map(page => (
          <li key={page} className="page-item">
            <button 
              className={`page-link rounded-circle border-0 fw-bold d-flex align-items-center justify-content-center transition-all ${
                currentPage === page ? 'shadow-lg scale-110' : ''
              }`}
              style={{ 
                width: '40px', 
                height: '40px', 
                backgroundColor: currentPage === page ? 'var(--primary-color)' : 'var(--bg-card)', 
                color: currentPage === page ? 'var(--bg-deep)' : 'var(--text-dim)',
                transition: 'all 0.3s ease'
              }}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </li>
        ))}

        <li className={`page-item ${currentPage === totalPages ? 'disabled opacity-25' : ''}`}>
          <button 
            className="page-link rounded-circle border-0 d-flex align-items-center justify-content-center" 
            style={{ 
              width: '40px', 
              height: '40px', 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--primary-color)' 
            }}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={20} />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Paginacion;
