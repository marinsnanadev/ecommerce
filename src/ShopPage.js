import React, { useEffect, useRef, useState } from 'react';
import redSuit from './assets/clothing/suits/red-suit (1).jpg';
import whiteSuit from './assets/clothing/suits/white-suit (1).jpg';
import brownSkirt from './assets/clothing/skirts/brown-skirt (2).jpg';
import whiteSkirt from './assets/clothing/skirts/white-skirt (2).jpg';
import blackDress from './assets/clothing/dresses/black-dress.jpg';
import longBlackDress from './assets/clothing/dresses/long-black-dress.jpg';
import whiteAndBlueDress from './assets/clothing/dresses/white-blue-dress.jpg';
import redBlouse from './assets/clothing/blouses/red-blouse (1).jpg';
import yellowJacket from './assets/clothing/jackets/yellow-jacket (2).jpg';
import blackPants from './assets/clothing/pants/black-pants (1).jpg';
import greenPurse from './assets/clothing/purses/green-purse.jpg';
import whiteMiniPurse from './assets/clothing/purses/white-mini-purse.jpg';
import whitePurse from './assets/clothing/purses/white-purse.jpg';
import yellowBrownPurse from './assets/clothing/purses/yellow-brown-purse.jpg';

import suitCrop from './assets/shop-banner/suit-crop.jpg';
import skirtCrop from './assets/shop-banner/skirt-crop.jpg';
import dressCrop from './assets/shop-banner/dress-crop.jpg';
import blouseCrop from './assets/shop-banner/blouse-crop.jpg';
import jacketCrop from './assets/shop-banner/jacket-crop.jpg';
import pantsCrop from './assets/shop-banner/pants-crop.jpg';
import purseCrop from './assets/shop-banner/purse-crop.jpg';

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
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

const categories = [
  {
    name: 'Suits',
    description: 'Sharp tailoring and sculptural silhouettes.',
    image: suitCrop,
    accent: 'Tailored essentials',
    products: [
      { id: 'red-suit', name: 'Red Suit', tag: 'New', price: '$220', blurb: 'A precise cut with sculpted shoulders.', image: redSuit, isNew: true, isFeatured: true },
      { id: 'white-suit', name: 'White Suit', tag: 'Featured', price: '$180', blurb: 'Clean lines with fluid movement.', image: whiteSuit, isFeatured: true },
    ],
  },
  {
    name: 'Skirts',
    description: 'Fluid movement with elevated structure.',
    image: skirtCrop,
    accent: 'Soft volume',
    products: [
      { id: 'brown-skirt', name: 'Brown Skirt', tag: 'Featured', price: '$150', blurb: 'Soft drape with a dramatic return.', image: brownSkirt, isFeatured: true },
      { id: 'white-skirt', name: 'White Skirt', tag: 'New', price: '$130', blurb: 'An effortless silhouette for daily dressing.', image: whiteSkirt, isNew: true },
    ],
  },
  {
    name: 'Dresses',
    description: 'Evening-ready pieces with a modern edge.',
    image: dressCrop,
    accent: 'Editorial form',
    products: [
      { id: 'black-dress', name: 'Black Dress', tag: 'Featured', price: '$240', blurb: 'A dramatic column in polished satin.', image: blackDress, isFeatured: true },
      { id: 'long-black-dress', name: 'Long Black Dress', tag: 'New', price: '$210', blurb: 'Fluid structure with a striking neckline.', image: longBlackDress, isNew: true },
      { id: 'white-and-blue-dress', name: 'White and Blue Dress', tag: 'Limited', price: '$290', blurb: 'Statement volume for special occasions.', image: whiteAndBlueDress, isFeatured: false },
    ],
  },
  {
    name: 'Blouses',
    description: 'Refined layers with clean, polished lines.',
    image: blouseCrop,
    accent: 'Quiet luxury',
    products: [
      { id: 'red-blouse', name: 'Red Blouse', tag: 'New', price: '$120', blurb: 'A crisp finish for polished layering.', image: redBlouse, isNew: true },
    ],
  },
  {
    name: 'Jackets',
    description: 'Structured outerwear for bold simplicity.',
    image: jacketCrop,
    accent: 'Layering staples',
    products: [
      { id: 'yellow-jacket', name: 'Yellow Jacket', tag: 'Featured', price: '$200', blurb: 'Structured with a fluid, soft shoulder.', image: yellowJacket, isFeatured: true },
    ],
  },
  {
    name: 'Pants',
    description: 'Modern cuts designed for movement.',
    image: pantsCrop,
    accent: 'Clean lines',
    products: [
      { id: 'black-pants', name: 'Black Pants', tag: 'Featured', price: '$140', blurb: 'A high-rise staple with clean tailoring.', image: blackPants, isFeatured: true },
    ],
  },
  {
    name: 'Purses',
    description: 'Statement accessories with sculptural detail.',
    image: purseCrop,
    accent: 'Signature accents',
    products: [
      { id: 'green-purse', name: 'Green Purse', tag: 'Featured', price: '$95', blurb: 'A compact silhouette with sculptural form.', image: greenPurse, isFeatured: true },
      { id: 'white-mini-purse', name: 'White Mini Purse', tag: 'New', price: '$110', blurb: 'Soft structure for everyday carry.', image: whiteMiniPurse, isNew: true },
      { id: 'yellow-brown-purse', name: 'Yellow or Brown Purse', tag: 'Limited', price: '$125', blurb: 'Elevated evening texture in a minimalist shape.', image: yellowBrownPurse, isFeatured: false },
      { id: 'white-purse', name: 'White Purse', tag: 'New', price: '$130', blurb: 'A versatile piece with a sculptural edge.', image: whitePurse, isNew: true },
    ],
  },
];

function ShopPage({ onBackToHome, onSelectCategory }) {
  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="site-nav">
        <button type="button" className="nav-back-btn" onClick={onBackToHome}>
          ← Back
        </button>
        <span className="nav-mark">VIOLET</span>
        <div style={{ width: '40px' }} />
      </nav>

      <main className="shop-page">
        <section className="shop-hero">
          <p className="eyebrow">Collection overview</p>
          <h1>Shop all categories</h1>
          <p>
            Discover the full wardrobe edit across suits, skirts, dresses, blouses, jackets,
            pants and purses.
          </p>
        </section>

        <Reveal as="section" className="shop-grid">
          {categories.map((category, index) => (
            <Reveal key={category.name} as="article" className="shop-card" style={{ transitionDelay: `${index * 80}ms` }}>
              <div className="shop-card-image">
                <img src={category.image} alt={category.name} />
              </div>
              <div className="shop-card-content">
                <p className="shop-card-accent">{category.accent}</p>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <button type="button" className="shop-card-link" onClick={() => onSelectCategory(category)}>
                  View collection
                </button>
              </div>
            </Reveal>
          ))}
        </Reveal>
      </main>
    </div>
  );
}

export default ShopPage;
