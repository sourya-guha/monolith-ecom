'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth-context';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-[#64748b] mb-6 text-sm">Add some products to get started!</p>
          <Link href="/shop" className="btn-gradient py-3 px-8">
            Start Shopping
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const shipping = cart.total >= 50 ? 0 : 9.99;
  const tax = cart.total * 0.08;
  const finalTotal = cart.total + shipping + tax;

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Shopping Cart</h1>
            <p className="text-xs text-[#64748b]">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.03]">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xl">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm sm:text-base truncate">{item.name}</h3>
                  <p className="text-[#c084fc] font-bold text-sm">${item.price}</p>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#7c3aed]/30 transition-all"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center font-semibold text-white text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#7c3aed]/30 transition-all"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <div className="text-right min-w-[60px] hidden sm:block">
                  <p className="font-semibold text-white text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-[#64748b] hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}

            <div className="flex justify-between items-center pt-3">
              <button
                onClick={clearCart}
                className="text-xs text-[#f43f5e] hover:underline font-medium"
              >
                Clear Cart
              </button>
              <Link href="/shop" className="text-xs text-[#c084fc] hover:underline font-medium">
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 h-fit sticky top-24"
          >
            <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Subtotal</span>
                <span className="text-white font-medium">${cart.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Shipping</span>
                <span className="text-white font-medium">{shipping === 0 ? <span className="text-emerald-400">Free</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Tax</span>
                <span className="text-white font-medium">${tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="gradient-text">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <Link href="/checkout" className="btn-gradient w-full py-3 text-base">
              Checkout
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}