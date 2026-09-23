import { API_BASE } from './apiConfig';

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchAccount(token) {
  const res = await fetch(`${API_BASE}/account`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Erro ao buscar dados da conta');
  return res.json();
}

export async function updateAccount(token, updates) {
  const res = await fetch(`${API_BASE}/account`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Erro ao atualizar conta');
  return res.json();
}

// Structured checkout failure: the /orders backend returns `detail` either
// as a plain string (generic errors) or as an object with a `code`
// (PRODUCT_REMOVED, PRICE_CHANGED) plus extra data the UI can act on.
// Wrapping it here keeps `body.detail` — which may not be a string — from
// ever leaking straight into `new Error(...)` and rendering as
// "[object Object]" wherever the error message is shown.
export class CheckoutError extends Error {
  constructor(detail) {
    const message = typeof detail === 'string'
      ? detail
      : detail?.message || 'Error completing order';
    super(message);
    this.name = 'CheckoutError';
    this.code = typeof detail === 'object' && detail ? detail.code : undefined;
    this.details = typeof detail === 'object' && detail ? detail : undefined;
  }
}

export async function placeOrder(token, checkoutInfo, sessionId, idempotencyKey) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? authHeaders(token) : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(token ? checkoutInfo : { ...checkoutInfo, session_id: sessionId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new CheckoutError(body.detail);
  }
  return res.json();
}