import React from 'react';

function ToastNotifications({ toasts }) {
  return toasts.map((toast, index) => (
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
}

export default ToastNotifications;