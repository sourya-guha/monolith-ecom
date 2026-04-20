'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth-context';
import { AppApiError, normalizeUser, userApi } from '../lib/api';
import { User, Shield, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const displayUser = profile ? normalizeUser(profile) : user;

  useEffect(() => {
    if (user) {
      fetchProfile();
      setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email });
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const data = await userApi.getProfile();
      setProfile(data as UserProfile);
    } catch (error) {
      if (error instanceof AppApiError && (error.status === 401 || error.status === 403)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
        return;
      }
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updatedProfile = await userApi.updateProfile(formData);
      const normalized = normalizeUser(updatedProfile as any) as UserProfile & {
        firstName: string; lastName: string; name: string;
      };
      setProfile(normalized);
      localStorage.setItem('user', JSON.stringify(normalized));
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Please log in</h2>
          <p className="text-[#64748b] text-sm">You need to be logged in to view your profile.</p>
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

  const roleBadge: Record<string, string> = {
    admin: 'bg-[#f43f5e]/15 text-[#fb7185]',
    seller: 'bg-emerald-500/15 text-emerald-300',
    user: 'bg-[#7c3aed]/15 text-[#c084fc]',
  };

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#f43f5e] hover:bg-[#f43f5e]/10 border border-[#f43f5e]/20 transition-all"
          >
            <LogOut size={15} />
            Logout
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="glass-card p-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                <span className="text-2xl font-bold text-white">
                  {(displayUser?.firstName || '').charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                {displayUser?.firstName} {displayUser?.lastName}
              </h2>
              <p className="text-sm text-[#64748b] mb-3">{displayUser?.email}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${roleBadge[displayUser?.role || 'user']}`}>
                {displayUser?.role}
              </span>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Account Overview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Member since</span>
                  <span className="text-white font-medium text-xs">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Account type</span>
                  <span className="text-white font-medium capitalize text-xs">{displayUser?.role}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Edit Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
                  <User size={16} />
                </div>
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-[#94a3b8] mb-1.5">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="input-dark" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="input-dark" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="input-dark" />
                </div>
                <button type="submit" disabled={updating} className="btn-gradient py-2.5 px-6 text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {updating ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
                  <Shield size={16} />
                </div>
                <h3 className="text-lg font-bold text-white">Security</h3>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Password', desc: 'Last changed 30 days ago', action: 'Change' },
                  { title: 'Two-Factor Auth', desc: 'Add extra security', action: 'Enable' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div>
                      <h4 className="text-sm font-medium text-white">{item.title}</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">{item.desc}</p>
                    </div>
                    <button className="text-xs text-[#c084fc] font-semibold hover:underline">{item.action}</button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
