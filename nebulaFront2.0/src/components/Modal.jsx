import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal component for the Nebula 2.0 system.
 * 
 * @param {Object} props
 * @param {boolean} props.show - Controls visibility
 * @param {function} props.onClose - Callback function to close the modal
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.icon - Icon to display next to the title
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} props.footer - Optional footer buttons
 * @param {string} props.maxWidth - Optional max-width (default: 500px)
 */
const Modal = ({ show, onClose, title, icon, children, footer, maxWidth = '500px' }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  return (
    <div 
      className="nebula-modal-overlay d-flex justify-content-center align-items-center p-3" 
      onClick={onClose}
    >
      <div 
        className="nebula-modal-container card border-0 shadow-lg animate__animated animate__zoomIn animate__faster d-flex flex-column"
        style={{ width: '100%', maxWidth: maxWidth, maxHeight: '90vh', backgroundColor: 'var(--bg-card)', borderRadius: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="card-header border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center p-4 flex-shrink-0">
          <div className="d-flex align-items-center gap-3">
            {icon && (
              <div className="p-2 rounded bg-primary bg-opacity-10 text-primary d-flex">
                {icon}
              </div>
            )}
            <h5 className="mb-0 fw-bold text-white">{title}</h5>
          </div>
          <button 
            className="btn btn-link text-white opacity-50 hover-opacity-100 p-0 transition-all" 
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="card-body p-4 text-white overflow-auto nebula-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="card-footer border-top border-secondary border-opacity-10 p-4 d-flex gap-2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        .nebula-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }
        
        .nebula-modal-container {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .hover-opacity-100:hover {
          opacity: 1 !important;
          transform: scale(1.1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;
