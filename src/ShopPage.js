import React, { useEffect, useRef, useState } from 'react';
import { imageMap } from './imageMap';
import { API_BASE } from './apiConfig';
import './ShopPage.css';

function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.18 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

function ShopPage({ onBackToHome, onSelectCategory, cartItemsCount = 0, onOpenCart }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => {
        if (!res.ok) throw new Error('Error fetching categories');
        return res.json();
      })
      .then((data) => {
        setCategories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="shop-loading">Loading collection...</div>;
  }

  if (error) {
    return <div className="shop-error">Error: {error}</div>;
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="site-nav">
        <button type="button" className="nav-back-btn" onClick={onBackToHome}>
          ← Back
        </button>
        <span className="nav-mark">VIOLET</span>
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

      <main className="shop-page">
        <section className="shop-hero">
          <p className="eyebrow">Collection overview</p>
          <h1>Shop all categories</h1>
          <p>
            Discover the full wardrobe edit across suits, skirts, dresses, blouses, jackets,
            pants and purses.
          </p>
        </section>

        <Reveal as="section" className="shop-grid">
          {categories.map((category, index) => (
            <Reveal key={category.name} as="article" className="shop-card" style={{ transitionDelay: `${index * 80}ms` }}>
              <div className="shop-card-image">
                <img src={imageMap[category.image]} alt={category.name} />
              </div>
              <div className="shop-card-content">
                <p className="shop-card-accent">{category.accent}</p>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <button type="button" className="shop-card-link" onClick={() => onSelectCategory(category)}>
                  View collection
                </button>
              </div>
            </Reveal>
          ))}
        </Reveal>
      </main>
    </div>
  );
}

export default ShopPage;