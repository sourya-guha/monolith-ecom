'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCart } from '../lib/cart';
import { userApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { CreditCard, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    street: '', city: '', state: '', pincode: '',
  });

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (!hasMounted) return;
    if (!user) router.push('/login');
    else if (user.role === 'seller') router.replace('/seller/dashboard');
    else if (cart.items.length === 0) router.push('/cart');
  }, [hasMounted, user, cart.items.length, router]);

  if (!hasMounted || !user || cart.items.length === 0) return null;

  const shipping = cart.total >= 50 ? 0 : 9.99;
  const tax = cart.total * 0.08;
  const total = cart.total + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      alert('Please fill in all shipping address fields');
      return;
    }
    setLoading(true);
    try {
      await userApi.createOrder({
        items: cart.items.map(item => ({ product: item.id, quantity: item.quantity, price: item.price })),
        shippingAddress,
      });
      clearCart();
      router.push('/orders?success=true');
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-8"
        >
          Checkout
        </motion.h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Shipping */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
                  <MapPin size={16} />
                </div>
                <h2 className="text-lg font-bold text-white">Shipping Address</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="street" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Street Address</label>
                  <input type="text" id="street" name="street" value={shippingAddress.street} onChange={handleInputChange} required className="input-dark" placeholder="123 Main Street" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="city" className="block text-xs font-medium text-[#94a3b8] mb-1.5">City</label>
                    <input type="text" id="city" name="city" value={shippingAddress.city} onChange={handleInputChange} required className="input-dark" placeholder="New York" />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-xs font-medium text-[#94a3b8] mb-1.5">State</label>
                    <input type="text" id="state" name="state" value={shippingAddress.state} onChange={handleInputChange} required className="input-dark" placeholder="NY" />
                  </div>
                </div>
                <div>
                  <label htmlFor="pincode" className="block text-xs font-medium text-[#94a3b8] mb-1.5">ZIP Code</label>
                  <input type="text" id="pincode" name="pincode" value={shippingAddress.pincode} onChange={handleInputChange} required className="input-dark" placeholder="10001" />
                </div>
              </div>
            </motion.div>

            {/* Payment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
                  <CreditCard size={16} />
                </div>
                <h2 className="text-lg font-bold text-white">Payment</h2>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/[0.08] border border-amber-500/20">
                <p className="text-amber-300 text-sm">
                  💳 Payment integration coming soon. Orders are processed as cash on delivery.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right — Order Summary */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6 sticky top-24"
            >
              <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xs">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
                      <p className="text-xs text-[#64748b]">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.06] pt-4 space-y-2 text-sm">
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
                <div className="border-t border-white/[0.06] pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="gradient-text">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full py-3.5 text-base mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order...' : `Place Order — $${total.toFixed(2)}`}
              </button>
              <p className="text-center text-[10px] text-[#64748b] mt-3">
                By placing your order, you agree to our terms and conditions.
              </p>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}