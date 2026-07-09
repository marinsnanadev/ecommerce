import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import Reveal from './Reveal';
import ToastNotifications from './ToastNotifications';
import whiteMiniPurse from './assets/clothing/purses/white-mini-purse.jpg';
import { collections, featuredProducts, chunkCollections, blackDress, whiteSuit } from './homeData';

function HomePage({ cartItemsCount, onOpenCart, onOpenShop, onSelectCategory, addToCart, checkoutComplete, toasts }) {
  const [frontImageIndex, setFrontImageIndex] = useState(0);
  const [collectionOffset, setCollectionOffset] = useState(0);
  const [isCompactView, setIsCompactView] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1024 : false);

  const collectionSlides = isCompactView ? chunkCollections(collections, 4) : [collections];

  useEffect(() => {
    const interval = setInterval(() => {
      setFrontImageIndex(prev => (prev + 1) % 2);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsCompactView(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isCompactView) {
      setCollectionOffset(0);
    }
  }, [isCompactView]);

  const handleCategorySelect = (item) => {
    onSelectCategory({
      name: item.title,
      description: item.blurb,
      accent: item.title,
    });
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <Header
        cartItemsCount={cartItemsCount}
        onOpenCart={onOpenCart}
        onOpenShop={onOpenShop}
        frontImageIndex={frontImageIndex}
        blackDress={blackDress}
        whiteSuit={whiteSuit}
      />

      <ToastNotifications toasts={toasts} />
      {checkoutComplete && (
        <div className="toast-notification" style={{ bottom: '2rem' }}>
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <div className="toast-text">
              <p className="toast-title">Order placed successfully</p>
              <p className="toast-price">Thanks for shopping with VIOLET</p>
            </div>
          </div>
        </div>
      )}

      <main>
        <Reveal as="section" className="collections-section" id="shop">
          <div className="collection-header">
            <div className="section-heading">
              <p className="eyebrow">Curated forms</p>
              <h2>Shop by category</h2>
            </div>
            {isCompactView && (
              <div className="collection-nav-buttons">
                <button
                  type="button"
                  className="collection-nav-btn collection-prev-btn"
                  aria-label="Show previous categories"
                  onClick={() => setCollectionOffset((prev) => (prev - 1 + collectionSlides.length) % collectionSlides.length)}
                >
                  <span aria-hidden="true">←</span>
                </button>
                <button
                  type="button"
                  className="collection-nav-btn collection-next-btn"
                  aria-label="Show more categories"
                  onClick={() => setCollectionOffset((prev) => (prev + 1) % collectionSlides.length)}
                >
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </div>
          <div className="collection-grid">
            <div
              className="collection-track"
              style={{ transform: isCompactView ? `translateX(-${collectionOffset * 100}%)` : 'translateX(0)' }}
            >
              {collectionSlides.map((slide, index) => (
                <div key={index} className="collection-slide">
                  {slide.map((item) => (
                    <article
                      key={item.title}
                      className="collection-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCategorySelect(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleCategorySelect(item);
                        }
                      }}
                    >
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
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal as="section" className="featured-section" id="story">
          <div className="editorial-panel">
            <div className="editorial-image">
              <img src={whiteMiniPurse} alt="Statement bag and accessories" />
            </div>
            <div className="editorial-copy">
              <p className="eyebrow">Why VIOLET</p>
              <h2>&ldquo;Lorem ipsum dolor sit amet&rdquo;</h2>
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
                  <p className="product-price">{product.price}</p>
                  <button type="button" className="purchase-btn" onClick={() => addToCart(product)}>Add to bag</button>
                </div>
              </article>
            ))}
          </div>
        </Reveal>
      </main>

      <Footer />

      <section className="footer-extended">
        <div className="customer-service">
          <h3>Customer Service</h3>
          <ul>
            <li><a href="#shop">Shop</a></li>
            <li><a href="#story">Story</a></li>
            <li><a href="mailto:">Contact Us</a></li>
          </ul>
        </div>

        <div className="social-media">
          <h3>Follow Us</h3>
          <ul>
            <li><a href="" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="" target="_blank" rel="noopener noreferrer">Twitter</a></li>
          </ul>
        </div>

        <div className="newsletter">
          <h3>Newsletter</h3>
          <p>Sign up for our newsletter to receive the latest updates and offers.</p>
          <form>
            <input type="email" placeholder="Your email address" />
            <button type="submit">Subscribe</button>
          </form>
        </div>

        <div className="legal">
          <h3>Legal</h3>
          <ul>
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms-of-service">Terms of Service</a></li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export default HomePage;