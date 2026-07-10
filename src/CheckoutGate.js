import React, { useState } from 'react';
import AuthForm from './AuthForm';
import './CheckoutPage.css';
import './CheckoutGate.css';

function CheckoutGate({ cartItemsCount, onBackToCart, onContinueAsGuest, onLogin, onRegister }) {
  const [showAuthForm, setShowAuthForm] = useState(false);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="site-nav">
        <button type="button" className="nav-back-btn" onClick={onBackToCart}>
          ← Back to bag
        </button>
        <span className="nav-mark">VIOLET</span>
        <div style={{ position: 'relative' }}>
          <button type="button" className="nav-bag" aria-label="View bag" onClick={onBackToCart}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </button>
          {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
        </div>
      </nav>

      <div className="checkout-page checkout-gate-page">
        <div className="checkout-hero">
          <div className="checkout-hero-copy">
            <p className="eyebrow">Checkout</p>
            <h1>How would you like to continue?</h1>
          </div>
        </div>

        {!showAuthForm ? (
          <div className="checkout-gate-choices">
            <button type="button" className="checkout-gate-card" onClick={onContinueAsGuest}>
              <h2>Continue as guest</h2>
              <p>Fast checkout, no account needed. You can always create one later.</p>
            </button>
            <button type="button" className="checkout-gate-card checkout-gate-card--accent" onClick={() => setShowAuthForm(true)}>
              <h2>Log in or create an account</h2>
              <p>Save your details and track your orders. Items already in your bag will follow you.</p>
            </button>
          </div>
        ) : (
          <div className="checkout-gate-auth">
            <button type="button" className="checkout-gate-back" onClick={() => setShowAuthForm(false)}>
              ← Choose a different option
            </button>
            <AuthForm onLogin={onLogin} onRegister={onRegister} />
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutGate;