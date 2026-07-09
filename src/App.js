import './App.css';
import './Home.css';
import React, { useState } from 'react';
import splashImage from './assets/images/splash.jpg';
import SplashPage from './SplashPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import ShopPage from './ShopPage';
import CategoryPage from './CategoryPage';
import HomePage from './HomePage';
import ToastNotifications from './ToastNotifications';
import { useCart } from './useCart';

function App() {
  const [showStorefront, setShowStorefront] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const { cartItems, toasts, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setCurrentPage('category');
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
          onGoToCheckout={() => setCurrentPage('checkout')}
        />
      </>
    );
  }

  if (currentPage === 'checkout') {
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
    <HomePage
      cartItemsCount={cartItems.length}
      onOpenCart={() => setCurrentPage('cart')}
      onOpenShop={() => setCurrentPage('shop')}
      onSelectCategory={handleSelectCategory}
      addToCart={addToCart}
      checkoutComplete={checkoutComplete}
      toasts={toasts}
    />
  );
}

export default App;