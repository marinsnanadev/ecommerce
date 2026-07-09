import { useState, useEffect, useRef } from 'react';
import { imageMap } from './imageMap';
import { getSessionId } from './session';
import { fetchCart, addItemToCart, updateItemQuantity, removeItemFromCart, clearCartApi } from './cartApi';

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const sessionId = useRef(getSessionId()).current;

  const loadCart = async () => {
    try {
      const data = await fetchCart(sessionId);
      const mapped = data.map((entry) => ({
        item_id: entry.item_id,
        id: entry.product.id,
        name: entry.product.name,
        price: entry.product.price,
        image: imageMap[entry.product.image],
        category: entry.product.category,
        quantity: entry.quantity,
      }));
      setCartItems(mapped);
    } catch (err) {
      console.warn('Erro ao carregar carrinho:', err);
      setCartItems([]);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addToCart = async (product) => {
    try {
      await addItemToCart(sessionId, product.id, 1);
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
      await removeItemFromCart(sessionId, itemId);
      await loadCart();
    } catch (err) {
      console.error('Erro ao remover item:', err);
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await updateItemQuantity(sessionId, itemId, quantity);
      await loadCart();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
    }
  };

  const clearCart = async () => {
    try {
      await clearCartApi(sessionId);
      await loadCart();
    } catch (err) {
      console.error('Erro ao limpar carrinho:', err);
    }
  };

  return { cartItems, toasts, addToCart, removeFromCart, updateQuantity, clearCart };
}