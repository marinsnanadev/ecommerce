import './App.css';
import React, { useState } from 'react';
import splashImage from './assets/images/splash.jpg';
import puppyCorset from './assets/clothing/corset/puppy-corset.jpg';
import midiDress from './assets/clothing/dresses/midi-dress.jpg';
import dollBag from './assets/clothing/bags/doll-bag.jpg';

const collections = [
  { title: 'Corsets', blurb: 'Architectural lines with a rebellious soul.', image: puppyCorset, accent: 'violet' },
  { title: 'Dresses', blurb: 'Fluid structure for evening glamour.', image: midiDress, accent: 'lavender' },
  { title: 'Purses', blurb: 'Statement accessories with a cinematic finish.', image: dollBag, accent: 'ink' },
];

const featuredProducts = [
  { name: 'Puppy corset', price: '$180', category: 'Corsets', image: puppyCorset },
  { name: 'Midi Dress', price: '$120', category: 'Dresses', image: midiDress },
  { name: 'Doll bag', price: '$95', category: 'Purses', image: dollBag },
];

function App() {
  const [showStorefront, setShowStorefront] = useState(false);

  if (!showStorefront) {
    return (
      <div className="splash-page">
        <img className="splash-image" src={splashImage} alt="Violet fashion campaign" />
        <div className="splash-overlay" />
        <div className="splash-content">
          <p className="splash-tag">fashion house</p>
          <h1 className="splash-title">VIOLET</h1>
          <button type="button" className="splash-button" onClick={() => setShowStorefront(true)}>
            Enter the page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Fashion house</p>
          <h1 className="brand-title">VIOLET</h1>
          <p className="hero-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <div className="hero-actions">
            <a href="#shop" className="primary-btn">Explore the edit</a>
            <a href="#story" className="secondary-btn">Meet the house</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="spotlight-card spotlight-main">
            <img src={puppyCorset} alt="Editorial corset look" />
          </div>
          <div className="spotlight-card spotlight-side">
            <img src={midiDress} alt="Editorial dress look" />
          </div>
        </div>
      </header>

      <main>
        <section className="collections-section" id="shop">
          <div className="section-heading">
            <p className="eyebrow">Curated forms</p>
            <h2>Shop by category</h2>
          </div>
          <div className="collection-grid">
            {collections.map((item) => (
              <article key={item.title} className={`collection-card ${item.accent}`}>
                <div className="card-image">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="card-content">
                  <h3>{item.title}</h3>
                  <p>{item.blurb}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="featured-section" id="story">
          <div className="editorial-panel">
            <div className="editorial-image">
              <img src={dollBag} alt="Statement bag and accessories" />
            </div>
            <div className="editorial-copy">
              <p className="eyebrow">Why VIOLET</p>
              <h2>Lorem ipsum dolor sit amet</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua
              </p>
            </div>
          </div>

          <div className="product-list">
            {featuredProducts.map((product) => (
              <article key={product.name} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                </div>
                <div className="product-meta">
                  <span>{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.price}</p>
                  <button type="button" className="purchase-btn">Add to bag</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
