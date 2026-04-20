'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Handbag, Search, LogOut, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex justify-between items-center bg-white/95 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-gray-200 mx-4 mt-6"
    >
      {/* Logo */}
      <div className="text-xl font-bold text-gray-800">
        <Link href={user?.role === 'seller' ? '/seller/dashboard' : '/'}>PROJECT-X</Link>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        {user?.role !== 'seller' && (
          <Link
            href="/"
            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            Home
          </Link>
        )}

        {user?.role !== 'seller' && (
          <Link
            href="/shop"
            className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            Shop
          </Link>
        )}

        {!user ? (
          <>
            <Link
              href="/login"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Log In
            </Link>

            <Link
              href="/signin"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </>
        ) : (
          <>
            {/* User-specific links */}
            {user.role === 'user' && (
              <>
                <Link
                  href="/orders"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  href="/chats"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
                >
                  <MessageCircle size={16} />
                  Chats
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Profile
                </Link>
              </>
            )}

            {/* Seller-specific links */}
            {user.role === 'seller' && (
              <>
                <Link
                  href="/seller/dashboard"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/seller/products"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Products
                </Link>
                <Link
                  href="/seller/chats"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1"
                >
                  <MessageCircle size={16} />
                  Chats
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Profile
                </Link>
              </>
            )}

            {/* Admin-specific links */}
            {user.role === 'admin' && (
              <>
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Admin
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
                >
                  Users
                </Link>
              </>
            )}

            <button
              onClick={logout}
              className="text-gray-600 hover:text-red-600 font-medium transition-colors flex items-center gap-1"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        )}

        {user && user.role !== 'seller' && (
          <>
            <Link
              href="/shop"
              className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
            >
              <Search size={20} />
            </Link>

            <Link href="/cart" className="text-gray-600 hover:text-blue-600 font-medium transition-colors relative">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative inline-flex">
                <Handbag size={20} />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </motion.div>
            </Link>
          </>
        )}


      </div>
    </motion.nav>
  );
}