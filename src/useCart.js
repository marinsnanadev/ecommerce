import { useState, useEffect, useRef } from 'react';
import { imageMap } from './imageMap';
import { getSessionId } from './session';
import {
  fetchCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  clearCartApi,
  fetchMyCart,
  addItemToMyCart,
  updateMyItemQuantity,
  removeMyItemFromCart,
  clearMyCartApi,
} from './cartApi';

export function useCart(token) {
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const sessionId = useRef(getSessionId()).current;
  const isAuthenticated = Boolean(token);

  const mapCartResponse = (data) =>
    data.map((entry) => ({
      item_id: entry.item_id,
      id: entry.product.id,
      name: entry.product.name,
      price: entry.product.price,
      image: imageMap[entry.product.image],
      category: entry.product.category,
      quantity: entry.quantity,
    }));

  const loadCart = async () => {
    try {
      const data = isAuthenticated ? await fetchMyCart(token) : await fetchCart(sessionId);
      setCartItems(mapCartResponse(data));
    } catch (err) {
      console.warn('Erro ao carregar carrinho:', err);
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addToCart = async (product) => {
    try {
      if (isAuthenticated) {
        await addItemToMyCart(token, product.id, 1);
      } else {
        await addItemToCart(sessionId, product.id, 1);
      }
      await loadCart();
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err);
    }

    const toastId = `${product.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prevToasts) => [...prevToasts, { id: toastId, product }]);
    window.setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    }, 3000);
  };

  const removeFromCart = async (itemId) => {
    try {
      if (isAuthenticated) {
        await removeMyItemFromCart(token, itemId);
      } else {
        await removeItemFromCart(sessionId, itemId);
      }
      await loadCart();
    } catch (err) {
      console.error('Erro ao remover item:', err);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (isAuthenticated) {
        await updateMyItemQuantity(token, itemId, quantity);
      } else {
        await updateItemQuantity(sessionId, itemId, quantity);
      }
      await loadCart();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        await clearMyCartApi(token);
      } else {
        await clearCartApi(sessionId);
      }
      await loadCart();
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
    }
  };

  return { cartItems, toasts, addToCart, removeFromCart, updateQuantity, clearCart, reloadCart: loadCart, sessionId };
}