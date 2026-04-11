'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';
import { Edit, Eye, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const data: any = await adminApi.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      // Refresh orders
      await fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!user || user.role !== 'admin') {
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
            <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
            <p className="text-gray-600 mt-1">Process and track all orders on the platform</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No orders found</h3>
            <p className="text-gray-600">Orders will appear here once customers place them.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-md p-6">
                {/* Order Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 pb-4 border-b">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Order #{order._id.slice(-8)}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    {order.user && (
                      <p className="text-gray-600 text-sm">
                        Customer: {order.user.name} ({order.user.email})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      disabled={updatingStatus === order._id}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                      {orderStatuses.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    <span className={`px-3 py-2 rounded-full text-sm font-medium self-start ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 text-sm">{item.product.name}</h4>
                        <p className="text-gray-600 text-xs">Qty: {item.quantity} × ${item.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800 text-sm">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pt-4 border-t">
                  <div className="mb-4 lg:mb-0">
                    <h4 className="font-medium text-gray-800 mb-2">Shipping Address</h4>
                    <p className="text-gray-600 text-sm">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      Total: ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Stats */}
        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-6">
            {orderStatuses.map(status => {
              const count = orders.filter(order => order.status === status).length;
              return (
                <div key={status} className="bg-white rounded-xl shadow-md p-6 text-center">
                  <div className="text-2xl font-bold text-gray-800 mb-1">{count}</div>
                  <div className="text-gray-600 capitalize">{status}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}