'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';
import { Users, Package, ShoppingCart, DollarSign, UserCheck, BarChart3, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface DashboardStats { totalUsers: number; totalSellers: number; totalProducts: number; totalOrders: number; totalRevenue: number; }
interface AdminOrderSummary { totalPrice: number; }

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalSellers: 0, totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user && user.role === 'admin') fetchDashboardData(); }, [user]);

  const fetchDashboardData = async () => {
    try {
      const users = (await adminApi.getUsers()) as unknown;
      const sellers = (await adminApi.getSellers()) as unknown;
      const products = (await adminApi.getProducts()) as unknown;
      const orders = (await adminApi.getOrders()) as AdminOrderSummary[] | unknown;
      const userList = Array.isArray(users) ? users : [];
      const sellerList = Array.isArray(sellers) ? sellers : [];
      const productList = Array.isArray(products) ? products : [];
      const orderList = Array.isArray(orders) ? (orders as AdminOrderSummary[]) : [];
      const totalRevenue = orderList.reduce((sum: number, order: AdminOrderSummary) => sum + (order?.totalPrice || 0), 0);
      setStats({ totalUsers: userList.length, totalSellers: sellerList.length, totalProducts: productList.length, totalOrders: orderList.length, totalRevenue });
    } catch (error) { console.error('Failed to fetch dashboard data:', error); }
    finally { setLoading(false); }
  };

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">🚫</div><h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2><p className="text-[#64748b]">You don&apos;t have permission to access this page.</p></div></div>;
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Users', value: stats.totalUsers, icon: <Users size={20} />, gradient: 'from-blue-500/20 to-cyan-500/20', color: 'text-blue-400' },
    { label: 'Sellers', value: stats.totalSellers, icon: <UserCheck size={20} />, gradient: 'from-emerald-500/20 to-green-500/20', color: 'text-emerald-400' },
    { label: 'Products', value: stats.totalProducts, icon: <Package size={20} />, gradient: 'from-purple-500/20 to-violet-500/20', color: 'text-purple-400' },
    { label: 'Orders', value: stats.totalOrders, icon: <ShoppingCart size={20} />, gradient: 'from-orange-500/20 to-amber-500/20', color: 'text-orange-400' },
    { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: <DollarSign size={20} />, gradient: 'from-amber-500/20 to-yellow-500/20', color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-[#64748b] mt-1">Manage your ecommerce platform</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#64748b]">Welcome back,</p>
            <p className="font-semibold text-white text-sm">{user?.firstName} {user?.lastName}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card p-5 bg-gradient-to-br ${s.gradient}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-[#64748b]">{s.label}</p>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Management */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Management</h2>
            <div className="space-y-3">
              {[
                { href: '/admin/users', icon: <Users size={20} />, title: 'Manage Users', desc: 'View and manage all users', value: stats.totalUsers, color: 'text-blue-400' },
                { href: '/admin/products', icon: <Package size={20} />, title: 'Manage Products', desc: 'Review and moderate products', value: stats.totalProducts, color: 'text-purple-400' },
                { href: '/admin/orders', icon: <ShoppingCart size={20} />, title: 'Manage Orders', desc: 'Process and track orders', value: stats.totalOrders, color: 'text-orange-400' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-[#7c3aed]/30 hover:bg-white/[0.04] transition-all group">
                  <div className="flex items-center gap-3">
                    <span className={item.color}>{item.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="text-xs text-[#64748b]">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold gradient-text">{item.value}</span>
                    <ArrowRight size={14} className="text-[#64748b] group-hover:text-[#c084fc] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4">Platform Analytics</h2>
            <div className="space-y-3">
              {[
                { icon: <BarChart3 size={20} />, title: 'Revenue Growth', desc: 'Monthly revenue trends', value: '+12.5%', sub: 'vs last month', color: 'text-emerald-400' },
                { icon: <UserCheck size={20} />, title: 'User Acquisition', desc: 'New users this month', value: '+8.2%', sub: 'vs last month', color: 'text-blue-400' },
                { icon: <Package size={20} />, title: 'Product Listings', desc: 'Active product listings', value: String(stats.totalProducts), sub: 'total listings', color: 'text-purple-400' },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <span className={item.color}>{item.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <p className="text-xs text-[#64748b]">{item.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-[10px] text-[#64748b]">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { icon: <Users size={16} />, title: 'New user registered', desc: 'john.doe@example.com joined', time: '2 hours ago', color: 'text-blue-400', bg: 'from-blue-500/20 to-cyan-500/20' },
              { icon: <Package size={16} />, title: 'New product added', desc: 'Wireless Headphones listed by TechStore', time: '4 hours ago', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-green-500/20' },
              { icon: <ShoppingCart size={16} />, title: 'Order completed', desc: 'Order #12345 has been delivered', time: '6 hours ago', color: 'text-orange-400', bg: 'from-orange-500/20 to-amber-500/20' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.bg} flex items-center justify-center ${item.color}`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-[#64748b] truncate">{item.desc}</p>
                </div>
                <div className="text-[10px] text-[#64748b] flex-shrink-0">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
