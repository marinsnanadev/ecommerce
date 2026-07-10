import './App.css';
import './Home.css';
import React, { useState } from 'react';
import splashImage from './assets/images/splash.jpg';
import SplashPage from './SplashPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import CheckoutGate from './CheckoutGate';
import AuthModal from './AuthModal';
import ConfirmModal from './ConfirmModal';
import ShopPage from './ShopPage';
import CategoryPage from './CategoryPage';
import HomePage from './HomePage';
import ToastNotifications from './ToastNotifications';
import { useCart } from './useCart';
import { useAuth } from './useAuth';

function App() {
  const [showStorefront, setShowStorefront] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [continueAsGuest, setContinueAsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const auth = useAuth();
  const { cartItems, toasts, addToCart, removeFromCart, updateQuantity, clearCart, sessionId } = useCart(auth.token);

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setCurrentPage('category');
  };

  const goToCheckout = () => {
    setContinueAsGuest(false);
    setCurrentPage('checkout');
  };

  if (!showStorefront) {
    return <SplashPage image={splashImage} onEnter={() => setShowStorefront(true)} />;
  }

  if (currentPage === 'cart') {
    return (
      <>
        <ToastNotifications toasts={toasts} />
        <CartPage
          items={cartItems}
          cartItemsCount={cartItems.length}
          onOpenCart={() => setCurrentPage('cart')}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onBackToHome={() => setCurrentPage('home')}
          onClearCart={clearCart}
          onGoToCheckout={goToCheckout}
        />
      </>
    );
  }

  if (currentPage === 'checkout') {
    // Convidado ainda não escolheu como prosseguir: mostra a tela de decisão
    if (!auth.isAuthenticated && !continueAsGuest) {
      return (
        <CheckoutGate
          cartItemsCount={cartItems.length}
          onBackToCart={() => setCurrentPage('cart')}
          onContinueAsGuest={() => setContinueAsGuest(true)}
          onLogin={(email, password) => auth.login(email, password, sessionId)}
          onRegister={(name, email, password) => auth.register(name, email, password, sessionId)}
        />
      );
    }

    return (
      <>
        <ToastNotifications toasts={toasts} />
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
            setContinueAsGuest(false);
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
        onSelectCategory={handleSelectCategory}
      />
    );
  }

  if (currentPage === 'category' && selectedCategory) {
    return (
      <>
        <ToastNotifications toasts={toasts} />
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
    <>
      <HomePage
        cartItemsCount={cartItems.length}
        onOpenCart={() => setCurrentPage('cart')}
        onOpenShop={() => setCurrentPage('shop')}
        onSelectCategory={handleSelectCategory}
        addToCart={addToCart}
        checkoutComplete={checkoutComplete}
        toasts={toasts}
        user={auth.user}
        onLogout={() => setShowLogoutConfirm(true)}
        onOpenLogin={() => setShowAuthModal(true)}
      />
      {showLogoutConfirm && (
        <ConfirmModal
          title="Log out of your account?"
          message="You can log back in anytime to pick up where you left off."
          confirmLabel="Log out"
          cancelLabel="Stay logged in"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={() => {
            auth.logout();
            setShowLogoutConfirm(false);
          }}
        />
      )}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => {
            await auth.login(email, password, sessionId);
            setShowAuthModal(false);
          }}
          onRegister={async (name, email, password) => {
            await auth.register(name, email, password, sessionId);
            setShowAuthModal(false);
          }}
        />
      )}
    </>
  );
}

export default App;