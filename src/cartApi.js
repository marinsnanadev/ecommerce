import { API_BASE } from './apiConfig';

export async function fetchCart(sessionId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}`);
  if (!res.ok) throw new Error('Erro ao buscar carrinho');
  return res.json();
}

export async function addItemToCart(sessionId, productId, quantity = 1) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
  if (!res.ok) throw new Error('Erro ao adicionar ao carrinho');
  return res.json();
}

export async function updateItemQuantity(sessionId, itemId, quantity) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}/item/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar quantidade');
  return res.json();
}

export async function removeItemFromCart(sessionId, itemId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}/item/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao remover item');
  return res.json();
}

export async function clearCartApi(sessionId) {
  const res = await fetch(`${API_BASE}/cart/${sessionId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erro ao limpar carrinho');
  return res.json();
}