import React from 'react';

function SplashPage({ image, onEnter }) {
  return (
    <div className="splash-page">
      <img className="splash-image" src={image} alt="Violet fashion campaign" />
      <div className="splash-overlay" />
      <div className="splash-content">
        <p className="splash-tag">fashion house</p>
        <h1 className="splash-title">VIOLET</h1>
        <button type="button" className="splash-button" onClick={onEnter}>
          Enter the page
        </button>
      </div>
    </div>
  );
}

export default SplashPage;
