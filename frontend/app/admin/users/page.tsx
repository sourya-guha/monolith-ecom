'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';
import { Trash2, User, Shield, Crown } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  createdAt: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers() || [];
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setUpdatingRole(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setDeletingUser(userId);
    try {
      await adminApi.deleteUser(userId);
      setUsers((users || []).filter(u => u._id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setDeletingUser(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="text-yellow-600" size={16} />;
      case 'seller':
        return <Shield className="text-blue-600" size={16} />;
      default:
        return <User className="text-gray-600" size={16} />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      case 'seller':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users on the platform</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{(users || []).length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>

        {(users || []).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No users found</h3>
            <p className="text-gray-600">Users will appear here once they register.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                <div className="col-span-1">Avatar</div>
                <div className="col-span-3">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-4">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {(users || []).map((userData) => (
                <div key={userData._id} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Avatar */}
                    <div className="col-span-1">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {userData?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="col-span-3">
                      <h3 className="font-semibold text-gray-800">{userData?.name}</h3>
                      <p className="text-gray-600 text-sm">{userData?.email}</p>
                    </div>

                    {/* Role */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(userData?.role)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userData?.role)}`}>
                          {userData?.role}
                        </span>
                      </div>
                    </div>

                    {/* Joined Date */}
                    <div className="col-span-2">
                      <span className="text-gray-600 text-sm">
                        {new Date(userData?.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex gap-2">
                      {/* Role Change Dropdown */}
                      <select
                        value={userData.role}
                        onChange={(e) => handleRoleChange(userData._id, e.target.value)}
                        disabled={updatingRole === userData._id}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteUser(userData._id)}
                        disabled={deletingUser === userData._id}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {deletingUser === userData._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Stats */}
        {(users || []).length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {(users || []).filter(u => u?.role === 'user').length}
              </div>
              <div className="text-gray-600">Regular Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {(users || []).filter(u => u?.role === 'seller').length}
              </div>
              <div className="text-gray-600">Sellers</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {(users || []).filter(u => u?.role === 'admin').length}
              </div>
              <div className="text-gray-600">Admins</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
