import React from 'react';
import './Nav.css';
import './Header.css';

function Header({ cartItemsCount, onOpenCart, onOpenShop, frontImageIndex, blackDress, whiteSuit, user, onLogout, onOpenLogin, onOpenAccount }) {
  return (
    <>
      <nav className="site-nav">
        <span className="nav-mark">VIOLET</span>
        <div className="nav-links">
          <button type="button" className="nav-link-btn" onClick={onOpenShop}>
            Shop
          </button>
          <a href="#story">Story</a>
          {user ? (
            <span className="nav-account">
              <button type="button" className="nav-link-btn nav-account-name" onClick={onOpenAccount}>
                Hi, {user.name.split(' ')[0]}
              </button>
              <button type="button" className="nav-link-btn nav-logout-btn" onClick={onLogout}>
                Log out
              </button>
            </span>
          ) : (
            <button type="button" className="nav-link-btn" onClick={onOpenLogin}>
              Log in
            </button>
          )}
        </div>
        <div className="nav-actions">
          <button
            type="button"
            className="nav-bag"
            aria-label={user ? 'My account' : 'Log in'}
            onClick={user ? onOpenAccount : onOpenLogin}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="3.4" />
              <path d="M5 20c0-3.6 3.1-6.4 7-6.4s7 2.8 7 6.4" />
            </svg>
          </button>
          <div style={{ position: 'relative' }}>
            <button type="button" className="nav-bag" aria-label="View bag" onClick={onOpenCart}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>
            </button>
            {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
          </div>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Fashion house — FW26</p>
          <h1 className="brand-title">VIOLET</h1>
          <p className="hero-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <div className="hero-actions">
            <a href="#shop" className="primary-btn">
              Explore the edit
            </a>
            <a href="#story" className="secondary-btn">
              Meet the house
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <span className="hero-rail">FW26 — THE EDIT</span>
          <div className="hero-deck">
            <div className="hero-deck-shape" />
            <div className="hero-deck-card hero-deck-card--back">
              <img className={`hero-image ${frontImageIndex === 0 ? 'is-active' : ''}`} src={blackDress} alt="Editorial group look" />
              <img className={`hero-image ${frontImageIndex === 1 ? 'is-active' : ''}`} src={whiteSuit} alt="Editorial group look alternate" />
            </div>
            <div className="hero-deck-card hero-deck-card--front">
              <img className={`hero-image ${frontImageIndex === 0 ? 'is-active' : ''}`} src={whiteSuit} alt="Editorial suit look" />
              <img className={`hero-image ${frontImageIndex === 1 ? 'is-active' : ''}`} src={blackDress} alt="Editorial suit look alternate" />
              <span className="hero-tag">02 / Look</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;