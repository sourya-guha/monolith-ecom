'use client';

import React from 'react';
import { Handbag, Search, User, LogOut, Package, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <nav className=" flex justify-between items-center bg-gray-100 rounded-xl shadow-lg p-6 border border-gray-200">
      {/* Logo */}
      <div className="text-xl font-bold text-gray-800">
        <Link href="/">PROJECT-X</Link>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
        >
          Home
        </Link>

        <Link
          href="/shop"
          className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
        >
          Shop
        </Link>

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
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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

        <Link
          href="/shop"
          className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
        >
          <Search size={20} />
        </Link>

        <Link
          href="/cart"
          className="text-gray-600 hover:text-blue-600 font-medium transition-colors relative"
        >
          <Handbag size={20} />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>


      </div>
    </nav>
  );
}