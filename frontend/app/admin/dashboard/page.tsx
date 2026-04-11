'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';
import { Users, Package, ShoppingCart, DollarSign, UserCheck, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface AdminOrderSummary {
  totalPrice: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const users = await adminApi.getUsers() || [];
      const sellers = await adminApi.getSellers() || [];
      const products = await adminApi.getProducts() || [];
      const orders = await adminApi.getOrders() || [];

      // Calculate stats
      const totalRevenue = (orders || []).reduce(
        (sum: number, order: AdminOrderSummary) => sum + (order?.totalPrice || 0),
        0
      );

      setStats({
        totalUsers: (users || []).length,
        totalSellers: (sellers || []).length,
        totalProducts: (products || []).length,
        totalOrders: (orders || []).length,
        totalRevenue,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your ecommerce platform</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Sellers</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalSellers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ShoppingCart className="text-orange-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-800">${stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Management Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">User Management</h2>
            <div className="space-y-4">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="text-blue-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Manage Users</h3>
                    <p className="text-gray-600 text-sm">View and manage all users</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
              </Link>

              <Link
                href="/admin/products"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="text-purple-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Manage Products</h3>
                    <p className="text-gray-600 text-sm">Review and moderate products</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalProducts}</div>
              </Link>

              <Link
                href="/admin/orders"
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-orange-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Manage Orders</h3>
                    <p className="text-gray-600 text-sm">Process and track orders</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-orange-600">{stats.totalOrders}</div>
              </Link>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Platform Analytics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-green-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Revenue Growth</h3>
                    <p className="text-gray-600 text-sm">Monthly revenue trends</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">+12.5%</div>
                  <div className="text-xs text-gray-500">vs last month</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserCheck className="text-blue-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">User Acquisition</h3>
                    <p className="text-gray-600 text-sm">New users this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">+8.2%</div>
                  <div className="text-xs text-gray-500">vs last month</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="text-purple-600" size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Product Listings</h3>
                    <p className="text-gray-600 text-sm">Active product listings</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-600">{stats.totalProducts}</div>
                  <div className="text-xs text-gray-500">total listings</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">New user registered</p>
                <p className="text-gray-600 text-sm">john.doe@example.com joined the platform</p>
              </div>
              <div className="text-sm text-gray-500">2 hours ago</div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="text-green-600" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">New product added</p>
                <p className="text-gray-600 text-sm">Wireless Headphones listed by TechStore</p>
              </div>
              <div className="text-sm text-gray-500">4 hours ago</div>
            </div>

            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="text-orange-600" size={20} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">Order completed</p>
                <p className="text-gray-600 text-sm">Order #12345 has been delivered</p>
              </div>
              <div className="text-sm text-gray-500">6 hours ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
