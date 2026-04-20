'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, LogOut, MessageCircle, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import { useCart } from '../lib/cart';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change via link click
  const closeMobile = () => setMobileOpen(false);

  const navLinks = () => {
    const links: { href: string; label: string; icon?: React.ReactNode }[] = [];

    if (user?.role !== 'seller') {
      links.push({ href: '/', label: 'Home' });
      links.push({ href: '/shop', label: 'Shop' });
    }

    if (!user) {
      links.push({ href: '/login', label: 'Log In' });
      links.push({ href: '/signin', label: 'Sign Up' });
    }

    if (user?.role === 'user') {
      links.push({ href: '/orders', label: 'My Orders' });
      links.push({ href: '/chats', label: 'Chats', icon: <MessageCircle size={15} /> });
      links.push({ href: '/profile', label: 'Profile' });
    }

    if (user?.role === 'seller') {
      links.push({ href: '/seller/dashboard', label: 'Dashboard' });
      links.push({ href: '/seller/products', label: 'Products' });
      links.push({ href: '/seller/chats', label: 'Chats', icon: <MessageCircle size={15} /> });
      links.push({ href: '/profile', label: 'Profile' });
    }

    if (user?.role === 'admin') {
      links.push({ href: '/admin/dashboard', label: 'Admin' });
      links.push({ href: '/admin/users', label: 'Users' });
      links.push({ href: '/profile', label: 'Profile' });
    }

    return links;
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0a0f]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link
              href={user?.role === 'seller' ? '/seller/dashboard' : '/'}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-sm">X</span>
              </div>
              <span className="text-lg font-bold tracking-tight gradient-text group-hover:opacity-80 transition-opacity">
                PROJECT-X
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks().map(({ href, label, icon }) => (
                <Link
                  key={href + label}
                  href={href}
                  className="relative px-3.5 py-2 text-sm font-medium text-[#94a3b8] hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/[0.05] flex items-center gap-1.5"
                >
                  {icon}
                  {label}
                </Link>
              ))}

              {user && (
                <button
                  onClick={logout}
                  className="px-3.5 py-2 text-sm font-medium text-[#94a3b8] hover:text-[#f43f5e] transition-colors duration-200 rounded-lg hover:bg-red-500/[0.08] flex items-center gap-1.5"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              )}
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {user && user.role !== 'seller' && (
                <>
                  <Link
                    href="/shop"
                    className="p-2.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-all"
                    aria-label="Search"
                  >
                    <Search size={18} />
                  </Link>

                  <Link
                    href="/cart"
                    className="relative p-2.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-all"
                    aria-label="Cart"
                  >
                    <ShoppingBag size={18} />
                    {itemCount > 0 && (
                      <motion.span
                        key={itemCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#f43f5e] to-[#ec4899] text-white text-[10px] font-bold rounded-full h-[18px] min-w-[18px] flex items-center justify-center px-1 shadow-lg shadow-pink-500/30"
                      >
                        {itemCount}
                      </motion.span>
                    )}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button + Cart */}
            <div className="flex lg:hidden items-center gap-2">
              {user && user.role !== 'seller' && (
                <Link
                  href="/cart"
                  className="relative p-2 rounded-lg text-[#94a3b8] hover:text-white transition-colors"
                  aria-label="Cart"
                >
                  <ShoppingBag size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-[#f43f5e] to-[#ec4899] text-white text-[10px] font-bold rounded-full h-[18px] min-w-[18px] flex items-center justify-center px-1">
                      {itemCount}
                    </span>
                  )}
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-all"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobile}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-72 bg-[#12121a]/95 backdrop-blur-2xl border-l border-white/[0.06] p-6 lg:hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <span className="text-lg font-bold gradient-text">Menu</span>
                <button
                  onClick={closeMobile}
                  className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {navLinks().map(({ href, label, icon }) => (
                  <Link
                    key={href + label}
                    href={href}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 text-[#94a3b8] hover:text-white hover:bg-white/[0.05] rounded-xl transition-all text-sm font-medium"
                  >
                    {icon}
                    {label}
                  </Link>
                ))}

                {user && user.role !== 'seller' && (
                  <Link
                    href="/shop"
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-4 py-3 text-[#94a3b8] hover:text-white hover:bg-white/[0.05] rounded-xl transition-all text-sm font-medium"
                  >
                    <Search size={15} />
                    Search
                  </Link>
                )}

                {user && (
                  <>
                    <div className="border-t border-white/[0.06] my-3" />
                    <button
                      onClick={() => { closeMobile(); logout(); }}
                      className="flex items-center gap-3 px-4 py-3 text-[#f43f5e] hover:bg-red-500/[0.08] rounded-xl transition-all text-sm font-medium w-full text-left"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}