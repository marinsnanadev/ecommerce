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

export async function placeOrder(token, checkoutInfo) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(checkoutInfo),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Erro ao finalizar pedido');
  }
  return res.json();
}