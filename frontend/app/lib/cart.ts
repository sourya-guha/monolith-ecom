'use client';

import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Cart utilities
export const cartUtils = {
  getCart: (): Cart => {
    if (typeof window === 'undefined') return { items: [], total: 0 };

    try {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  },

  saveCart: (cart: Cart): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  addItem: (product: Omit<CartItem, 'quantity'>, quantity: number = 1): Cart => {
    const cart = cartUtils.getCart();
    const existingItemIndex = cart.items.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ ...product, quantity });
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartUtils.saveCart(cart);
    return cart;
  },

  updateQuantity: (id: string, quantity: number): Cart => {
    const cart = cartUtils.getCart();
    const itemIndex = cart.items.findIndex(item => item.id === id);

    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartUtils.saveCart(cart);
    return cart;
  },

  removeItem: (id: string): Cart => {
    const cart = cartUtils.getCart();
    cart.items = cart.items.filter(item => item.id !== id);
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartUtils.saveCart(cart);
    return cart;
  },

  clearCart: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('cart');
  },

  getItemCount: (): number => {
    const cart = cartUtils.getCart();
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },
};

// Custom hook for cart management
export const useCart = () => {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    const currentCart = cartUtils.getCart();
    setCart(currentCart);
    setItemCount(currentCart.items.reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  const setCartState = (newCart: Cart) => {
    setCart(newCart);
    setItemCount(newCart.items.reduce((sum, item) => sum + item.quantity, 0));
  };

  const addItem = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const newCart = cartUtils.addItem(product, quantity);
    setCartState(newCart);
  };

  const updateQuantity = (id: string, quantity: number) => {
    const newCart = cartUtils.updateQuantity(id, quantity);
    setCartState(newCart);
  };

  const removeItem = (id: string) => {
    const newCart = cartUtils.removeItem(id);
    setCartState(newCart);
  };

  const clearCart = () => {
    cartUtils.clearCart();
    setCart({ items: [], total: 0 });
    setItemCount(0);
  };

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
  };
};