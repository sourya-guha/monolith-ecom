'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth-context';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user?.role === 'seller') {
      router.replace('/seller/dashboard');
    }
  }, [user, router]);

  if (!isClient) return null;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link
            href="/shop"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  const shipping = cart.total >= 50 ? 0 : 9.99;
  const tax = cart.total * 0.08;
  const finalTotal = cart.total + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4"
              >
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-gray-400 text-2xl">📦</div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800 mb-1">{item.name}</h3>
                  <p className="text-blue-600 font-bold text-lg">${item.price}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right min-w-[80px]">
                  <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                </div>

                <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-700 p-2">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            <div className="flex justify-between items-center pt-4">
              <button onClick={clearCart} className="text-red-600 hover:text-red-700 font-medium">
                Clear Cart
              </button>
              <Link href="/shop" className="text-blue-600 hover:text-blue-700 font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6 font-medium">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors block text-center"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}