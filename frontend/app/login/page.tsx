'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GoogleButton from '../components/GoogleButton';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { LogIn } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Background blobs */}
      <div className="blob blob-1 -top-60 -left-40 opacity-20" />
      <div className="blob blob-2 bottom-[-100px] right-[-80px] opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
              <LogIn size={22} className="text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-[#64748b] mt-2">Sign in to your account to continue</p>
          </div>

          <div className="flex justify-center gap-2 mb-6 text-sm">
            <span className="text-[#64748b]">Don&apos;t have an account?</span>
            <Link href="/signin" className="text-[#c084fc] font-medium hover:underline">Sign up</Link>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="w-full flex justify-center">
              <GoogleButton />
            </div>

            <div className="relative flex items-center w-full py-4">
              <div className="flex-grow border-t border-white/[0.06]" />
              <span className="flex-shrink mx-4 text-[#64748b] text-xs font-medium uppercase tracking-wider">
                or sign in with email
              </span>
              <div className="flex-grow border-t border-white/[0.06]" />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-dark"
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#94a3b8] mb-1.5">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-dark"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-center p-3 rounded-xl bg-[#f43f5e]/10 text-[#fb7185] border border-[#f43f5e]/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full py-3 text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
