import React, { useEffect, useMemo, useState } from 'react';
import Footer from './Footer';
import { formatPrice } from './formatPrice';
import { PAYMENT_METHODS } from './paymentMethods';
import { fetchAccount } from './accountApi';
import './Nav.css';
import './CartPage.css';
import './CheckoutPage.css';

const SHIPPING_COST = 12;
const TAX_RATE = 0.08;

function FormField({ id, label, ...inputProps }) {
    return (
        <div className="form-field">
            <label htmlFor={id}>{label}</label>
            <input id={id} {...inputProps} />
        </div>
    );
}

function FormSection({ title, children }) {
    return (
        <div className="form-section">
            <span className="form-section-title">{title}</span>
            {children}
        </div>
    );
}

function PaymentMethodSelector({ selectedId, onSelect }) {
    return (
        <div className="checkout-payment-block">
            <h2>Payment method</h2>
            <div className="payment-options">
                {PAYMENT_METHODS.map((method) => (
                    <label
                        key={method.id}
                        className={`payment-option${selectedId === method.id ? ' is-selected' : ''}`}
                    >
                        <input
                            type="radio"
                            name="payment-method"
                            value={method.id}
                            checked={selectedId === method.id}
                            onChange={() => onSelect(method.id)}
                        />
                        <div className="payment-option-content">
                            <img src={method.image} alt={method.label} className="payment-option-image" />
                            <span>{method.label}</span>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

function OrderSummary({ items, subtotal, tax, shipping, total, onPlaceOrder, isSubmitting, error }) {
    return (
        <aside className="checkout-summary-card">
            <h2>Order summary</h2>
            <div className="checkout-items-list">
                {items.map((item) => (
                    <div key={item.id} className="checkout-item-row">
                        <div>
                            <p className="checkout-item-name">{item.name}</p>
                            <p className="checkout-item-meta">Qty {item.quantity} · {item.category}</p>
                        </div>
                        <span className="checkout-item-price">{formatPrice(item.price)}</span>
                    </div>
                ))}
            </div>

            <div className="checkout-breakdown">
                <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="summary-row">
                    <span>Taxes</span>
                    <span>{formatPrice(tax)}</span>
                </div>
                <div className="summary-row">
                    <span>Shipping</span>
                    <span>{formatPrice(shipping)}</span>
                </div>
                <div className="summary-row total-row">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                </div>
            </div>

            {error && <p className="checkout-error">{error}</p>}

            <button type="button" className="checkout-btn" onClick={onPlaceOrder} disabled={isSubmitting}>
                {isSubmitting ? 'Placing order...' : 'Place order'}
            </button>
        </aside>
    );
}

function CheckoutPage({ items, cartItemsCount, onBackToCart, onPlaceOrder, user, token }) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(PAYMENT_METHODS[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address_street: '',
        address_city_state: '',
        address_zip: '',
    });

    useEffect(() => {
        if (!token) return;
        fetchAccount(token)
            .then((account) => {
                setForm((prev) => ({
                    ...prev,
                    name: account.name || prev.name,
                    email: account.email || prev.email,
                    phone: account.default_phone || prev.phone,
                    address_street: account.default_address_street || prev.address_street,
                    address_city_state: account.default_address_city_state || prev.address_city_state,
                    address_zip: account.default_address_zip || prev.address_zip,
                }));
                if (account.default_payment_method) {
                    setSelectedPaymentMethod(account.default_payment_method);
                }
            })
            .catch(() => {
                // sem defaults salvos ainda, sem problema — segue com o formulário em branco
            });
    }, [token]);

    const updateField = (field) => (event) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
        [items]
    );
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax + SHIPPING_COST;

    const handlePlaceOrder = async () => {
        setError(null);
        setIsSubmitting(true);
        try {
            await onPlaceOrder({ ...form, payment_method: selectedPaymentMethod });
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="app-shell">
            <div className="ambient ambient-one" />
            <div className="ambient ambient-two" />

            <nav className="site-nav">
                <button type="button" className="nav-back-btn" onClick={onBackToCart}>
                    ← Back to bag
                </button>
                <span className="nav-mark">VIOLET</span>
                <div style={{ position: 'relative' }}>
                    <button type="button" className="nav-bag" aria-label="View bag" onClick={onBackToCart}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M6 8h12l-1 12H7L6 8Z" />
                            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                        </svg>
                    </button>
                    {cartItemsCount > 0 && <span className="cart-badge">{cartItemsCount}</span>}
                </div>
            </nav>

            <main className="checkout-page">
                <section className="checkout-hero">
                    <div className="checkout-hero-copy">
                        <p className="eyebrow">Secure checkout</p>
                        <h1>Complete your order</h1>
                        <p>Enter your delivery details, review your bag, and choose the payment method that suits you best.</p>
                    </div>
                </section>

                <div className="checkout-grid">
                    <section className="checkout-form-card">
                        <FormSection title="Client information">
                            <FormField
                                id="client-name"
                                label="Name"
                                type="text"
                                placeholder="John Smith"
                                value={form.name}
                                onChange={updateField('name')}
                                required
                            />
                            <FormField
                                id="client-email"
                                label="Email"
                                type="email"
                                placeholder="johnsmith@example.com"
                                value={form.email}
                                onChange={updateField('email')}
                            />
                            <FormField
                                id="client-phone"
                                label="Phone"
                                type="tel"
                                placeholder="+1 (555) 123-4567"
                                value={form.phone}
                                onChange={updateField('phone')}
                            />
                        </FormSection>

                        <FormSection title="Delivery address">
                            <FormField
                                id="delivery-address"
                                label="Street, number"
                                placeholder="Rio Street, 123"
                                value={form.address_street}
                                onChange={updateField('address_street')}
                            />
                            <FormField
                                id="delivery-city-state"
                                label="City, State"
                                placeholder="Rio de Janeiro, Rio de Janeiro"
                                value={form.address_city_state}
                                onChange={updateField('address_city_state')}
                            />
                            <FormField
                                id="delivery-zip-code"
                                label="ZIP Code"
                                placeholder="20000-000"
                                value={form.address_zip}
                                onChange={updateField('address_zip')}
                            />
                        </FormSection>

                        <PaymentMethodSelector
                            selectedId={selectedPaymentMethod}
                            onSelect={setSelectedPaymentMethod}
                        />
                    </section>

                    <OrderSummary
                        items={items}
                        subtotal={subtotal}
                        tax={tax}
                        shipping={SHIPPING_COST}
                        total={total}
                        onPlaceOrder={handlePlaceOrder}
                        isSubmitting={isSubmitting}
                        error={error}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default CheckoutPage;