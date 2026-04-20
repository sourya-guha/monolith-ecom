'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface CartContextType {
  cart: Cart;
  itemCount: number;
  addItem: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart utilities
export const cartUtils = {
  normalizeCartItem: (input: any): CartItem | null => {
    if (!input || typeof input !== 'object') return null;

    const idRaw = input.id ?? input._id;
    const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw) : '';
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const price = Number(input.price);
    const quantity = Math.floor(Number(input.quantity ?? 1));
    const image = typeof input.image === 'string' ? input.image : undefined;

    if (!id || !name) return null;
    if (!Number.isFinite(price) || price < 0) return null;
    if (!Number.isFinite(quantity) || quantity <= 0) return null;

    return { id, name, price, quantity, image };
  },

  getCart: (): Cart => {
    if (typeof window === 'undefined') return { items: [], total: 0 };
    try {
      const cart = localStorage.getItem('cart');
      const parsed = cart ? JSON.parse(cart) : null;
      const itemsRaw = parsed && Array.isArray(parsed.items) ? parsed.items : [];

      const items: CartItem[] = itemsRaw
        .map(cartUtils.normalizeCartItem)
        .filter((x): x is CartItem => x !== null);

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return { items, total };
    } catch {
      return { items: [], total: 0 };
    }
  },

  saveCart: (cart: Cart): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('cart', JSON.stringify(cart));
  },

  addItem: (product: Omit<CartItem, 'quantity'> | any, quantity: number = 1): Cart => {
    const cart = cartUtils.getCart();
    const safeQty = Math.floor(Number(quantity));
    if (!Number.isFinite(safeQty) || safeQty <= 0) return cart;

    const normalized = cartUtils.normalizeCartItem({ ...product, quantity: safeQty });
    if (!normalized) {
      return cart;
    }
    const existingItemIndex = cart.items.findIndex((item) => item.id === normalized.id);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += safeQty;
    } else {
      cart.items.push(normalized);
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartUtils.saveCart(cart);
    return cart;
  },

  updateQuantity: (id: string, quantity: number): Cart => {
    const cart = cartUtils.getCart();
    if (!id) return cart;
    const safeQty = Math.floor(Number(quantity));
    if (!Number.isFinite(safeQty)) return cart;
    const itemIndex = cart.items.findIndex(item => item.id === id);

    if (itemIndex > -1) {
      if (safeQty <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex] = { ...cart.items[itemIndex], quantity: safeQty };
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
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({ items: [], total: 0 });
  const [itemCount, setItemCount] = useState<number>(0);

  // Initialize from localStorage on mount
  useEffect(() => {
    const currentCart = cartUtils.getCart();
    setCart(currentCart);
    setItemCount(currentCart.items.reduce((sum, item) => sum + item.quantity, 0));
  }, []);

  const updateCartState = (newCart: Cart) => {
    setCart(newCart);
    setItemCount(newCart.items.reduce((sum, item) => sum + item.quantity, 0));
  };

  const addItem = (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const newCart = cartUtils.addItem(product, quantity);
    updateCartState(newCart);
  };

  const updateQuantity = (id: string, quantity: number) => {
    const newCart = cartUtils.updateQuantity(id, quantity);
    updateCartState(newCart);
  };

  const removeItem = (id: string) => {
    const newCart = cartUtils.removeItem(id);
    updateCartState(newCart);
  };

  const clearCart = () => {
    cartUtils.clearCart();
    setCart({ items: [], total: 0 });
    setItemCount(0);
  };

  return (
    <CartContext.Provider value={{ cart, itemCount, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};