'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';

export const dynamic = 'force-dynamic';

interface OrderItem { product: { _id: string; name: string; price: number; images: string[] }; quantity: number; price: number; }
interface Order { _id: string; items: OrderItem[]; shippingAddress: { street: string; city: string; state: string; pincode: string }; totalPrice: number; status: string; createdAt: string; user?: { name: string; email: string }; }

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => { if (user && user.role === 'admin') fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    try { const data = await adminApi.getOrders(); setOrders(Array.isArray(data) ? data : []); }
    catch (error) { console.error('Failed to fetch orders:', error); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try { await adminApi.updateOrderStatus(orderId, newStatus); await fetchOrders(); }
    catch (error) { console.error('Failed to update order status:', error); alert('Failed to update order status.'); }
    finally { setUpdatingStatus(null); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = { pending: 'badge-pending', processing: 'badge-processing', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' };
    return map[status.toLowerCase()] || 'bg-white/[0.05] text-[#94a3b8]';
  };

  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!user || user.role !== 'admin') return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">🚫</div><h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2><p className="text-[#64748b]">You don&apos;t have permission to access this page.</p></div></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div><h1 className="text-2xl sm:text-3xl font-bold text-white">Order Management</h1><p className="text-sm text-[#64748b] mt-1">Process and track all orders</p></div>
          <div className="text-right"><div className="text-2xl font-bold gradient-text">{orders.length}</div><div className="text-xs text-[#64748b]">Total Orders</div></div>
        </motion.div>

        {orders.length === 0 ? (
          <div className="glass-card p-12 text-center"><div className="text-5xl mb-4">📦</div><h3 className="text-xl font-bold text-white mb-2">No orders found</h3><p className="text-[#64748b] text-sm">Orders will appear here once customers place them.</p></div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div key={order._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
                  <div className="mb-3 lg:mb-0">
                    <h3 className="text-sm font-semibold text-white">Order #{order._id.slice(-8)}</h3>
                    <p className="text-xs text-[#64748b] mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.user && <p className="text-xs text-[#94a3b8] mt-0.5">{order.user.name} ({order.user.email})</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)} disabled={updatingStatus === order._id}
                      className="input-dark py-1.5 px-3 text-xs appearance-none cursor-pointer disabled:opacity-50">
                      {orderStatuses.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
                    </select>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize text-center ${getStatusBadge(order.status)}`}>{order.status}</span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.03]">
                        {item.product.images?.length > 0 ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xs">📦</div>}
                      </div>
                      <div className="flex-1 min-w-0"><h4 className="text-sm font-medium text-white truncate">{item.product.name}</h4><p className="text-xs text-[#64748b]">{item.quantity} × ${item.price}</p></div>
                      <p className="text-sm font-semibold text-white">${(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-[#64748b] mb-2 sm:mb-0">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  <div className="text-lg font-bold gradient-text">${order.totalPrice.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {orderStatuses.map(status => {
              const count = orders.filter(o => o.status === status).length;
              return <div key={status} className="glass-card p-4 text-center"><div className="text-xl font-bold gradient-text">{count}</div><div className="text-xs text-[#64748b] capitalize">{status}</div></div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
