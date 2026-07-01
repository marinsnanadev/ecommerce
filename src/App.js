import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import splashImage from './assets/images/splash.jpg';
import redSuit from './assets/clothing/suits/red-suit (1).jpg';
import brownSkirt from './assets/clothing/skirts/brown-skirt (2).jpg';
import greenPurse from './assets/clothing/purses/green-purse.jpg';
import whiteSuit from './assets/clothing/suits/white-suit (1).jpg';
import blackDress from './assets/clothing/dresses/black-dress.jpg';
import SplashPage from './SplashPage';
import Header from './Header';
import CartPage from './CartPage';
import Footer from './Footer';
import ShopPage from './ShopPage';
import CategoryPage from './CategoryPage';
import { upsertCartItem } from './cartUtils';

const collections = [
  { index: '01', title: 'Suits', blurb: 'Architectural lines with a rebellious soul.', image: redSuit },
  { index: '02', title: 'Skirts', blurb: 'Fluid structure for evening glamour.', image: brownSkirt },
  { index: '03', title: 'Purses', blurb: 'Statement accessories with a cinematic finish.', image: greenPurse },
];

const featuredProducts = [
  { id: 'red-suit', index: '01', name: 'Red Suit', price: '$180', category: 'Suits', image: redSuit },
  { id: 'brown-skirt', index: '02', name: 'Brown Skirt', price: '$120', category: 'Skirts', image: brownSkirt },
  { id: 'green-purse', index: '03', name: 'Green Purse', price: '$95', category: 'Purses', image: greenPurse },
];

// Lightweight scroll-reveal wrapper — fades sections up into place as they enter view.
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
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function App() {
  const [showStorefront, setShowStorefront] = useState(false);
  const [frontImageIndex, setFrontImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrontImageIndex(prev => (prev + 1) % 2);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const addToCart = (product) => {
    setCartItems((prevItems) => upsertCartItem(prevItems, product));

    const toastId = `${product.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prevToasts) => [...prevToasts, { id: toastId, product }]);
    window.setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    }, 3000);
  };

  const removeFromCart = (idx) => {
    setCartItems((prevItems) => prevItems.filter((_, i) => i !== idx));
  };

  const updateQuantity = (idx, quantity) => {
    setCartItems((prevItems) => {
      const updated = [...prevItems];
      if (!updated[idx]) return prevItems;
      updated[idx].quantity = quantity;
      return updated;
    });
  };

  const toastNotifications = toasts.map((toast, index) => (
    <div key={toast.id} className="toast-notification" style={{ bottom: `${2 + index * 5.4}rem` }}>
      <div className="toast-content">
        <span className="toast-icon">✓</span>
        <div className="toast-text">
          <p className="toast-title">{toast.product.name} added to bag</p>
          <p className="toast-price">{toast.product.price}</p>
        </div>
      </div>
    </div>
  ));

  if (!showStorefront) {
    return <SplashPage image={splashImage} onEnter={() => setShowStorefront(true)} />;
  }

  if (currentPage === 'cart') {
    return (
      <>
        {toastNotifications}
        <CartPage
          items={cartItems}
          cartItemsCount={cartItems.length}
          onOpenCart={() => setCurrentPage('cart')}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onBackToHome={() => setCurrentPage('home')}
          onClearCart={() => setCartItems([])}
        />
      </>
    );
  }

  if (currentPage === 'shop') {
    return (
      <ShopPage
        onBackToHome={() => setCurrentPage('home')}
        onSelectCategory={(category) => {
          setSelectedCategory(category);
          setCurrentPage('category');
        }}
      />
    );
  }

  if (currentPage === 'category' && selectedCategory) {
    return (
      <>
        {toastNotifications}
        <CategoryPage
          category={selectedCategory}
          cartItemsCount={cartItems.length}
          onOpenCart={() => setCurrentPage('cart')}
          onBackToShop={() => setCurrentPage('shop')}
          onBackToHome={() => setCurrentPage('home')}
          onAddToCart={addToCart}
        />
      </>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <Header
        cartItemsCount={cartItems.length}
        onOpenCart={() => setCurrentPage('cart')}
        onOpenShop={() => setCurrentPage('shop')}
        frontImageIndex={frontImageIndex}
        blackDress={blackDress}
        whiteSuit={whiteSuit}
      />

      {toastNotifications}

      <main>
        <Reveal as="section" className="collections-section" id="shop">
          <div className="section-heading">
            <p className="eyebrow">Curated forms</p>
            <h2>Shop by category</h2>
          </div>
          <div className="collection-grid">
            {collections.map((item) => (
              <article key={item.title} className="collection-card">
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
        </Reveal>

        <Reveal as="section" className="featured-section" id="story">
          <div className="editorial-panel">
            <div className="editorial-image">
              <img src={greenPurse} alt="Statement bag and accessories" />
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

export default App;