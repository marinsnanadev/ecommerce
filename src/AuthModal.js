import React, { useEffect } from 'react';
import AuthForm from './AuthForm';
import './AuthModal.css';

function AuthModal({ onClose, onLogin, onRegister }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="auth-modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        <AuthForm onLogin={onLogin} onRegister={onRegister} />
      </div>
    </div>
  );
}

export default AuthModal;