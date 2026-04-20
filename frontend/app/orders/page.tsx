'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { userApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { Package, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OrderItem {
  product: { _id: string; name: string; price: number; images: string[]; };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: { street: string; city: string; state: string; pincode: string; };
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data = await userApi.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancellingOrder(orderId);
    try {
      await userApi.cancelOrder(orderId);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-pending',
      processing: 'badge-processing',
      shipped: 'badge-shipped',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled',
    };
    return map[status.toLowerCase()] || 'bg-white/[0.05] text-[#94a3b8]';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Please log in</h2>
          <p className="text-[#64748b] text-sm">You need to be logged in to view your orders.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
              <Package size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Orders</h1>
          </div>
          <span className="text-xs text-[#64748b] font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
        </motion.div>

        {orders.length === 0 ? (
          <div className="glass-card p-12 sm:p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
            <p className="text-[#64748b] mb-6 text-sm">When you place orders, they&apos;ll appear here.</p>
            <Link href="/shop" className="btn-gradient py-3 px-8">
              Start Shopping <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 sm:p-6"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Order #{order._id.slice(-8)}</h3>
                    <p className="text-xs text-[#64748b] mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 sm:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingOrder === order._id}
                        className="text-xs text-[#f43f5e] hover:underline font-medium disabled:opacity-50"
                      >
                        {cancellingOrder === order._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                        {item.product.images?.length > 0 ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#64748b] text-sm">📦</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{item.product.name}</h4>
                        <p className="text-xs text-[#64748b]">{item.quantity} × ${item.price}</p>
                      </div>
                      <p className="text-sm font-semibold text-white">${(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-white/[0.06]">
                  <div className="mb-3 sm:mb-0">
                    <p className="text-xs text-[#64748b]">
                      {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </p>
                  </div>
                  <div className="text-lg font-bold gradient-text">${order.totalPrice.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
