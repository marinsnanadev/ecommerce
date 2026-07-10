import React, { useState } from 'react';
import './AuthForm.css';

function AuthForm({ onLogin, onRegister, submitLabel }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
    } catch (err) {
      setError(err.message || 'Algo deu errado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-form-tabs">
        <button
          type="button"
          className={`auth-form-tab ${mode === 'login' ? 'is-active' : ''}`}
          onClick={() => { setMode('login'); setError(null); }}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`auth-form-tab ${mode === 'register' ? 'is-active' : ''}`}
          onClick={() => { setMode('register'); setError(null); }}
        >
          Criar conta
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <div className="form-field">
            <label htmlFor="auth-name">Nome</label>
            <input
              id="auth-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}
        <div className="form-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="auth-password">Senha</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {error && <p className="auth-form-error">{error}</p>}

        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Aguarde...' : (submitLabel || (mode === 'login' ? 'Entrar' : 'Criar conta'))}
        </button>
      </form>
    </div>
  );
}

export default AuthForm;