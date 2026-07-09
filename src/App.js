import './App.css';
import './Home.css';
import React, { useState, useEffect, useRef } from 'react';
import splashImage from './assets/images/splash.jpg';
import redSuit from './assets/clothing/suits/red-suit (1).jpg';
import brownSkirt from './assets/clothing/skirts/brown-skirt (2).jpg';
import greenPurse from './assets/clothing/purses/green-purse.jpg';
import whiteSuit from './assets/clothing/suits/white-suit (1).jpg';
import whiteSkirt from './assets/clothing/skirts/white-skirt (2).jpg';
import whitePurse from './assets/clothing/purses/white-purse.jpg';
import whiteMiniPurse from './assets/clothing/purses/white-mini-purse.jpg';
import blackDress from './assets/clothing/dresses/black-dress.jpg';
import redBlouse from './assets/clothing/blouses/red-blouse (2).jpg';
import yellowJacket from './assets/clothing/jackets/yellow-jacket (2).jpg';
import blackPants from './assets/clothing/pants/black-pants (2).jpg';
import glassesImage from './assets/clothing/glasses/glasses.jpg';
import SplashPage from './SplashPage';
import Header from './Header';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import Footer from './Footer';
import ShopPage from './ShopPage';
import CategoryPage from './CategoryPage';
import { imageMap } from './imageMap';
import { getSessionId } from './session';
import { fetchCart, addItemToCart, updateItemQuantity, removeItemFromCart, clearCartApi } from './cartApi';

const collections = [
  { index: '01', title: 'Suits', blurb: 'Architectural lines with a rebellious soul.', image: redSuit },
  { index: '02', title: 'Skirts', blurb: 'Fluid structure for evening glamour.', image: brownSkirt },
  { index: '03', title: 'Purses', blurb: 'Statement accessories with a cinematic finish.', image: greenPurse },
  { index: '04', title: 'Dresses', blurb: 'Tailored silhouettes made for evening movement.', image: blackDress },
  { index: '05', title: 'Blouses', blurb: 'Refined detail with an effortless edge.', image: redBlouse },
  { index: '06', title: 'Jackets', blurb: 'Sharp structure for polished layering.', image: yellowJacket },
  { index: '07', title: 'Pants', blurb: 'Clean lines with a fluid, modern drape.', image: blackPants },
  { index: '08', title: 'Glasses', blurb: 'Refined frames that sharpen every look.', image: glassesImage },
];

const featuredProducts = [
  { id: 'white-suit', index: '01', name: 'White Suit', price: '$180', category: 'Suits', image: whiteSuit },
  { id: 'white-skirt', index: '02', name: 'White Skirt', price: '$130', category: 'Skirts', image: whiteSkirt },
  { id: 'white-purse', index: '03', name: 'White Purse', price: '$130', category: 'Purses', image: whitePurse },
];

const chunkCollections = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

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
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [collectionOffset, setCollectionOffset] = useState(0);
  const [isCompactView, setIsCompactView] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1024 : false);

  const sessionId = useRef(getSessionId()).current;
  const collectionSlides = isCompactView ? chunkCollections(collections, 4) : [collections];

  const loadCart = async () => {
    try {
      const data = await fetchCart(sessionId);
      const mapped = data.map((entry) => ({
        item_id: entry.item_id,
        id: entry.product.id,
        name: entry.product.name,
        price: entry.product.price,
        image: imageMap[entry.product.image],
        category: entry.product.category,
        quantity: entry.quantity,
      }));
      setCartItems(mapped);
    } catch (err) {
      console.warn('Erro ao carregar carrinho:', err);
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setSelectedCategory({
      name: item.title,
      description: item.blurb,
      accent: item.title,
    });
    setCurrentPage('category');
  };

  const addToCart = async (product) => {
    try {
      await addItemToCart(sessionId, product.id, 1);
      await loadCart();
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err);
    }

    const toastId = `${product.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prevToasts) => [...prevToasts, { id: toastId, product }]);
    window.setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    }, 3000);
  };

  const removeFromCart = async (itemId) => {
    try {
      await removeItemFromCart(sessionId, itemId);
      await loadCart();
    } catch (err) {
      console.error('Erro ao remover item:', err);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await updateItemQuantity(sessionId, itemId, quantity);
      await loadCart();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi(sessionId);
      await loadCart();
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
    }
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
          onClearCart={clearCart}
          onGoToCheckout={() => setCurrentPage('checkout')}
        />
      </>
    );
  }

  if (currentPage === 'checkout') {
    return (
      <>
        {toastNotifications}
        <CheckoutPage
          items={cartItems}
          cartItemsCount={cartItems.length}
          onBackToCart={() => setCurrentPage('cart')}
          onBackToHome={() => {
            setCurrentPage('home');
            setCheckoutComplete(false);
          }}
          onPlaceOrder={() => {
            setCheckoutComplete(true);
            setCurrentPage('home');
            clearCart();
          }}
        />
      </>
    );
  }

  if (currentPage === 'shop') {
    return (
      <ShopPage
        onBackToHome={() => setCurrentPage('home')}
        onOpenCart={() => setCurrentPage('cart')}
        cartItemsCount={cartItems.length}
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

export default App;