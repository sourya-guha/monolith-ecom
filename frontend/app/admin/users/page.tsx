'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth-context';
import { adminApi } from '../../lib/api';
import { Trash2, User, Shield, Crown } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface User { _id: string; name: string; email: string; role: 'user' | 'seller' | 'admin'; createdAt: string; }

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => { if (user && user.role === 'admin') fetchUsers(); }, [user]);

  const fetchUsers = async () => {
    try { const data = (await adminApi.getUsers()) as unknown; setUsers(Array.isArray(data) ? data : []); }
    catch (error) { console.error('Failed to fetch users:', error); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change this user's role to ${newRole}?`)) return;
    setUpdatingRole(userId);
    try { await adminApi.updateUserRole(userId, newRole); await fetchUsers(); }
    catch (error) { console.error('Failed to update:', error); alert('Failed to update role.'); }
    finally { setUpdatingRole(null); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setDeletingUser(userId);
    try { await adminApi.deleteUser(userId); setUsers((users || []).filter(u => u._id !== userId)); }
    catch (error) { console.error('Failed to delete:', error); alert('Failed to delete user.'); }
    finally { setDeletingUser(null); }
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Crown className="text-amber-400" size={14} />;
    if (role === 'seller') return <Shield className="text-blue-400" size={14} />;
    return <User className="text-[#94a3b8]" size={14} />;
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return 'bg-amber-500/15 text-amber-300';
    if (role === 'seller') return 'bg-blue-500/15 text-blue-300';
    return 'bg-white/[0.05] text-[#94a3b8]';
  };

  if (!user || user.role !== 'admin') return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">🚫</div><h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2><p className="text-[#64748b]">You don&apos;t have permission to access this page.</p></div></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>;

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div><h1 className="text-2xl sm:text-3xl font-bold text-white">User Management</h1><p className="text-sm text-[#64748b] mt-1">Manage all users on the platform</p></div>
          <div className="text-right"><div className="text-2xl font-bold gradient-text">{(users || []).length}</div><div className="text-xs text-[#64748b]">Total Users</div></div>
        </motion.div>

        {(users || []).length === 0 ? (
          <div className="glass-card p-12 text-center"><div className="text-5xl mb-4">👥</div><h3 className="text-xl font-bold text-white mb-2">No users found</h3><p className="text-[#64748b] text-sm">Users will appear here once they register.</p></div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block glass-card overflow-hidden">
              <div className="px-6 py-3 border-b border-white/[0.06]">
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                  <div className="col-span-1">Avatar</div><div className="col-span-3">User</div><div className="col-span-2">Role</div><div className="col-span-2">Joined</div><div className="col-span-4">Actions</div>
                </div>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {(users || []).map((userData) => (
                  <div key={userData._id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center"><span className="text-white font-semibold text-sm">{userData?.name?.charAt(0).toUpperCase()}</span></div></div>
                      <div className="col-span-3"><h3 className="font-semibold text-white text-sm">{userData?.name}</h3><p className="text-[#64748b] text-xs">{userData?.email}</p></div>
                      <div className="col-span-2"><div className="flex items-center gap-2">{getRoleIcon(userData?.role)}<span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${getRoleBadge(userData?.role)}`}>{userData?.role}</span></div></div>
                      <div className="col-span-2"><span className="text-[#64748b] text-xs">{new Date(userData?.createdAt || '').toLocaleDateString()}</span></div>
                      <div className="col-span-4 flex gap-2">
                        <select value={userData.role} onChange={(e) => handleRoleChange(userData._id, e.target.value)} disabled={updatingRole === userData._id}
                          className="input-dark py-1.5 px-3 text-xs appearance-none cursor-pointer disabled:opacity-50">
                          <option value="user">User</option><option value="seller">Seller</option><option value="admin">Admin</option>
                        </select>
                        <button onClick={() => handleDeleteUser(userData._id)} disabled={deletingUser === userData._id}
                          className="btn-gradient-secondary py-1.5 px-3 text-xs disabled:opacity-50"><Trash2 size={12} /> {deletingUser === userData._id ? '...' : 'Delete'}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {(users || []).map((userData, i) => (
                <motion.div key={userData._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center flex-shrink-0"><span className="text-white font-semibold text-sm">{userData?.name?.charAt(0).toUpperCase()}</span></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{userData?.name}</h3>
                      <p className="text-[#64748b] text-xs truncate">{userData?.email}</p>
                    </div>
                    <div className="flex items-center gap-1">{getRoleIcon(userData?.role)}<span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getRoleBadge(userData?.role)}`}>{userData?.role}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <select value={userData.role} onChange={(e) => handleRoleChange(userData._id, e.target.value)} disabled={updatingRole === userData._id}
                      className="input-dark py-1.5 px-3 text-xs flex-1 appearance-none cursor-pointer disabled:opacity-50">
                      <option value="user">User</option><option value="seller">Seller</option><option value="admin">Admin</option>
                    </select>
                    <button onClick={() => handleDeleteUser(userData._id)} disabled={deletingUser === userData._id}
                      className="btn-gradient-secondary py-1.5 px-3 text-xs disabled:opacity-50"><Trash2 size={12} /> {deletingUser === userData._id ? '...' : 'Delete'}</button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="glass-card p-5 mt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Regular Users', value: (users || []).filter(u => u?.role === 'user').length },
                  { label: 'Sellers', value: (users || []).filter(u => u?.role === 'seller').length },
                  { label: 'Admins', value: (users || []).filter(u => u?.role === 'admin').length },
                ].map(s => (
                  <div key={s.label}><div className="text-xl font-bold gradient-text">{s.value}</div><div className="text-xs text-[#64748b]">{s.label}</div></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
