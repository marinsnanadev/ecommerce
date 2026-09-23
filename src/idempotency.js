// A fresh key per checkout attempt (not persisted — unlike the cart's
// session id, this must NOT survive a page reload, or a genuinely new order
// placed after a reload could be mistaken for a retry of an old one).
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
