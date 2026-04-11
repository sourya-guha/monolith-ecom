'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { sellerApi } from '../../lib/api';
import { Package, ShoppingCart, DollarSign, TrendingUp, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentProducts: Product[];
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'seller') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const products = await sellerApi.getProducts() || [];

      // Mock stats - in a real app, you'd have a dedicated stats endpoint
      setStats({
        totalProducts: (products || []).length,
        totalOrders: 0, // Would come from API
        totalRevenue: 0, // Would come from API
        recentProducts: (products || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
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
            <h1 className="text-3xl font-bold text-gray-800">Seller Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <Link
            href="/seller/products/add"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="text-green-600" size={24} />
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

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Growth</p>
                <p className="text-2xl font-bold text-gray-800">+12%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Products</h2>
            <Link
              href="/seller/products"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>

          {stats.recentProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No products yet</h3>
              <p className="text-gray-600 mb-4">Start by adding your first product.</p>
              <Link
                href="/seller/products/add"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {stats.recentProducts.map((product) => (
                <div key={product._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-32 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    {product?.images?.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-400 text-2xl">📦</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-blue-600 font-bold">${product.price}</p>
                  <p className="text-sm text-gray-600">Stock: {product?.stock}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/seller/products/add"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="text-blue-600" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Add Product</h3>
                <p className="text-gray-600 text-sm">Create a new product listing</p>
              </div>
            </Link>

            <Link
              href="/seller/products"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="text-green-600" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">Manage Products</h3>
                <p className="text-gray-600 text-sm">Edit or delete your products</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <ShoppingCart className="text-purple-600" size={24} />
              <div>
                <h3 className="font-semibold text-gray-800">View Orders</h3>
                <p className="text-gray-600 text-sm">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}