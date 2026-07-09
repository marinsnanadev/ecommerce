import React from 'react';
import './Header.css';

function Header({ cartItemsCount, onOpenCart, onOpenShop, frontImageIndex, blackDress, whiteSuit }) {
  return (
    <>
      <nav className="site-nav">
        <span className="nav-mark">VIOLET</span>
        <div className="nav-links">
          <button type="button" className="nav-link-btn" onClick={onOpenShop}>
            Shop
          </button>
          <a href="#story">Story</a>
        </div>
        <div style={{ position: 'relative' }}>
          <button type="button" className="nav-bag" aria-label="View bag" onClick={onOpenCart}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </button>
          {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
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
