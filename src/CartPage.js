import React, { useState } from 'react';
import Footer from './Footer';
import { formatPrice } from './formatPrice';
import './Nav.css';
import './CartPage.css';

function CartPage({ items, cartItemsCount, onOpenCart, onRemoveItem, onUpdateQuantity, onBackToHome, onClearCart, onGoToCheckout }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

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

      <main className="cart-page">
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Shopping Bag</h1>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>Your bag is empty</p>
            <button type="button" className="checkout-btn" onClick={onBackToHome}>
              Back to shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.item_id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="cart-item-category">{item.category}</p>
                    <p className="cart-item-price">{formatPrice(item.price)}</p>
                  </div>
                  <div className="cart-item-controls">
                    <button type="button" onClick={() => onUpdateQuantity(item.item_id, Math.max(1, item.quantity - 1))}>
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.item_id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                      min="1"
                    />
                    <button type="button" onClick={() => onUpdateQuantity(item.item_id, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <p className="cart-item-subtotal">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                  <button type="button" className="remove-btn" style={{margin: '0.5rem 0'}} onClick={() => onRemoveItem(item.item_id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="summary-row">
                <span>Total:</span>
                <span className="total-price">{formatPrice(total)}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => setShowClearConfirm(true)}
                >
                  Remove all
                </button>
                <button type="button" className="checkout-btn" onClick={onGoToCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {showClearConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="clear-cart-modal-title">
          <div className="modal-card">
            <h3 id="clear-cart-modal-title">Remove all items?</h3>
            <p>This will delete everything currently in your bag.</p>
            <div className="modal-actions">
              <button type="button" className="checkout-btn" onClick={() => setShowClearConfirm(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="remove-btn"
                onClick={() => { onClearCart(); setShowClearConfirm(false); }}
              >
                Yes, remove all
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CartPage;