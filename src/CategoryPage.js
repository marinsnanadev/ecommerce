import React, { useState, useEffect } from 'react';
import { imageMap } from './imageMap';
import './CategoryPage.css';


function CategoryPage({ category, cartItemsCount, onOpenCart, onBackToShop, onBackToHome, onAddToCart }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products for the selected category when the component mounts or when the category changes

  useEffect(() => {
    if (!category?.name) return;

    setLoading(true);
    fetch(`http://127.0.0.1:8000/products/category/${category.name}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error fetching products');
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [category?.name]);

  const filteredItems = products.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'new') return item.is_new;
    if (activeFilter === 'featured') return item.is_featured;
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-low') {
      return Number(a.price.replace('$', '')) - Number(b.price.replace('$', ''));
    }
    if (sortBy === 'price-high') {
      return Number(b.price.replace('$', '')) - Number(a.price.replace('$', ''));
    }
    return Number(b.is_featured) - Number(a.is_featured) || Number(b.is_new) - Number(a.is_new);
  });

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="site-nav">
        <div className="nav-actions">
          <button type="button" className="nav-back-btn" onClick={onBackToShop}>
            ← Back to shop
          </button>
          <button type="button" className="nav-back-btn" onClick={onBackToHome}>
            Home
          </button>
        </div>
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

      <main className="category-page">
        <section className="category-hero">
          <div className="category-hero-copy">
            <p className="eyebrow">Category edit</p>
            <h1>{category?.name ?? 'Collection'}</h1>
            <p>{category?.description ?? 'Browse the latest pieces in this edit.'}</p>
          </div>
        </section>

        <section className="category-toolbar">
          <div className="filter-pills">
            {['all', 'new', 'featured'].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-pill ${activeFilter === filter ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter === 'all' ? 'All' : filter === 'new' ? 'New' : 'Featured'}
              </button>
            ))}
          </div>

          <label className="sort-control">
            <span>Sort price</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="price-low">Low to High</option>
              <option value="price-high">High to Low</option>
            </select>
          </label>
        </section>

        {loading && <p className="shop-loading">Loading products...</p>}
        {error && <p className="shop-error">Error: {error}</p>}

        {!loading && !error && (
          <section className="category-grid">
            {sortedItems.map((item) => (
              <article key={item.id} className="category-product-card">
                <div className="category-product-image">
                  {item.image ? (
                    <img src={imageMap[item.image]} alt={item.name} />
                  ) : (
                    <div className="category-placeholder">
                      <span>Photo placeholder</span>
                    </div>
                  )}
                </div>
                <div className="category-product-content">
                  <p className="shop-card-accent">{item.tag}</p>
                  <h3>{item.name}</h3>
                  <p>{item.blurb}</p>
                  <div className="category-product-meta">
                    <span>{item.price}</span>
                    <button
                      type="button"
                      className="purchase-btn"
                      onClick={() => onAddToCart({ ...item, image: imageMap[item.image], category: category?.name ?? 'Collection' })}
                    >
                      Add to bag
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default CategoryPage;