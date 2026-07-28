import { API_BASE } from './apiConfig';

export async function fetchCart(sessionId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}`);
  if (!res.ok) throw new Error('Error fetching cart');
  return res.json();
}

export async function addItemToCart(sessionId, productId, quantity = 1) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!res.ok) throw new Error('Error adding to cart');
  return res.json();
}

export async function updateItemQuantity(sessionId, itemId, quantity) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}/item/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Error updating quantity');
  return res.json();
}

export async function removeItemFromCart(sessionId, itemId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}/item/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error removing item');
  return res.json();
}

export async function clearCartApi(sessionId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error clearing cart');
  return res.json();
}

// --- Authenticated user's cart -------------------------------------

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchMyCart(token) {
  const res = await fetch(`${API_BASE}/cart/me`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Error fetching cart');
  return res.json();
}

export async function addItemToMyCart(token, productId, quantity = 1) {
  const res = await fetch(`${API_BASE}/cart/me/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!res.ok) throw new Error('Error adding to cart');
  return res.json();
}

export async function updateMyItemQuantity(token, itemId, quantity) {
  const res = await fetch(`${API_BASE}/cart/me/item/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Error updating quantity');
  return res.json();
}

export async function removeMyItemFromCart(token, itemId) {
  const res = await fetch(`${API_BASE}/cart/me/item/${itemId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error removing item');
  return res.json();
}

export async function clearMyCartApi(token) {
  const res = await fetch(`${API_BASE}/cart/me`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Error clearing cart');
  return res.json();
}