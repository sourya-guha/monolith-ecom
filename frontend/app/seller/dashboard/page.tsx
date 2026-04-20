'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth-context';
import { sellerApi } from '../../lib/api';
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Product {
  _id: string; name: string; description: string; price: number; category: string; stock: number; images: string[];
}

interface DashboardStats {
  totalProducts: number; totalOrders: number; totalRevenue: number; recentProducts: Product[];
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, recentProducts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'seller') fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const productsData = (await sellerApi.getProducts()) as unknown;
      const products = Array.isArray(productsData) ? productsData : [];
      setStats({ totalProducts: products.length, totalOrders: 0, totalRevenue: 0, recentProducts: products.slice(0, 5) });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#64748b]">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;
  }

  const statCards = [
    { label: 'Products', value: stats.totalProducts, icon: <Package size={20} />, gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-400' },
    { label: 'Orders', value: stats.totalOrders, icon: <ShoppingCart size={20} />, gradient: 'from-emerald-500/20 to-green-500/20', iconColor: 'text-emerald-400' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign size={20} />, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
    { label: 'Growth', value: '+12%', icon: <TrendingUp size={20} />, gradient: 'from-purple-500/20 to-violet-500/20', iconColor: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Seller Dashboard</h1>
            <p className="text-sm text-[#64748b] mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <Link href="/seller/products/add" className="btn-gradient py-2.5 px-5 text-sm">
            <Plus size={16} /> Add Product
          </Link>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 bg-gradient-to-br ${s.gradient}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center ${s.iconColor}`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-[#64748b]">{s.label}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Products */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">Recent Products</h2>
            <Link href="/seller/products" className="text-xs text-[#c084fc] font-semibold hover:underline flex items-center gap-1">View All <ArrowRight size={12} /></Link>
          </div>
          {stats.recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-base font-semibold text-white mb-1">No products yet</h3>
              <p className="text-[#64748b] text-sm mb-4">Start by adding your first product.</p>
              <Link href="/seller/products/add" className="btn-gradient py-2.5 px-6 text-sm">Add Your First Product</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.recentProducts.map((product) => (
                <Link key={product._id} href={`/seller/products/${product._id}`} className="group">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-[#7c3aed]/30 transition-all">
                    <div className="h-28 rounded-lg overflow-hidden bg-white/[0.03] mb-3">
                      {product?.images?.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xl">📦</div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-sm truncate mb-1">{product.name}</h3>
                    <p className="text-[#c084fc] font-bold text-sm">${product.price}</p>
                    <p className="text-xs text-[#64748b]">Stock: {product?.stock}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: '/seller/products/add', icon: <Plus size={20} />, title: 'Add Product', desc: 'Create a new listing', color: 'text-blue-400' },
              { href: '/seller/products', icon: <Package size={20} />, title: 'Manage Products', desc: 'Edit or remove items', color: 'text-emerald-400' },
              { href: '#', icon: <ShoppingCart size={20} />, title: 'View Orders', desc: 'Coming soon', color: 'text-purple-400', disabled: true },
            ].map((a) => (
              <Link key={a.title} href={a.href} className={`flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all ${a.disabled ? 'opacity-40 pointer-events-none' : 'hover:border-[#7c3aed]/30 hover:bg-white/[0.04]'}`}>
                <span className={a.color}>{a.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                  <p className="text-xs text-[#64748b]">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
