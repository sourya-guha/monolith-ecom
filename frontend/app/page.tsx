'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { productApi } from './lib/api';
import { useAuth } from './lib/auth-context';
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'seller') {
      router.replace('/seller/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const products = (await productApi.getAll()) as Product[] | unknown;
        const productList = Array.isArray(products) ? products : [];
        setFeaturedProducts(productList.slice(0, 6));
        setLoadError(null);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { name: 'Electronics', icon: '📱', gradient: 'from-blue-500/20 to-cyan-500/20' },
    { name: 'Clothing', icon: '👕', gradient: 'from-pink-500/20 to-rose-500/20' },
    { name: 'Books', icon: '📚', gradient: 'from-amber-500/20 to-orange-500/20' },
    { name: 'Home & Garden', icon: '🏠', gradient: 'from-emerald-500/20 to-green-500/20' },
    { name: 'Sports', icon: '⚽', gradient: 'from-purple-500/20 to-violet-500/20' },
    { name: 'Beauty', icon: '💄', gradient: 'from-fuchsia-500/20 to-pink-500/20' },
  ];

  const features = [
    { icon: <Sparkles size={24} />, title: 'Curated Selection', desc: 'Hand-picked products from verified sellers' },
    { icon: <Shield size={24} />, title: 'Secure Shopping', desc: 'Your data and payments are always protected' },
    { icon: <Truck size={24} />, title: 'Fast Delivery', desc: 'Free shipping on orders above $50' },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
        {/* Animated blobs */}
        <div className="blob blob-1 -top-40 -left-40" />
        <div className="blob blob-2 top-20 right-[-100px]" />
        <div className="blob blob-3 bottom-[-80px] left-1/3" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-[#c084fc] mb-6"
          >
            <Sparkles size={12} />
            New arrivals every week
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            Discover the <br className="hidden sm:block" />
            <span className="gradient-text">Future of Shopping</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-base sm:text-lg text-[#94a3b8] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Explore curated products from trusted sellers worldwide. Premium quality, unbeatable prices, and an experience that feels effortless.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {user?.role !== 'seller' && (
              <Link href="/shop" className="btn-gradient text-base py-3.5 px-8">
                Explore Shop
                <ArrowRight size={18} />
              </Link>
            )}
            {!user && (
              <Link href="/signin" className="btn-outline-glass text-base py-3.5 px-8">
                Create Account
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link href="/seller/dashboard" className="btn-gradient text-base py-3.5 px-8">
                Manage Store
                <ArrowRight size={18} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Features Bar ─────────────────────────────── */}
      <section className="py-12 border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-4 p-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#4f46e5]/20 border border-[#7c3aed]/20 flex items-center justify-center text-[#c084fc]">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                  <p className="text-xs text-[#64748b] mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Shop by <span className="gradient-text">Category</span>
          </motion.h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Link href={`/shop?category=${cat.name.toLowerCase()}`}>
                  <div className={`glass-card glass-card-hover text-center p-5 sm:p-6 bg-gradient-to-br ${cat.gradient}`}>
                    <div className="text-3xl sm:text-4xl mb-3">{cat.icon}</div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">{cat.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            Featured <span className="gradient-text">Products</span>
          </motion.h2>

          {loadError ? (
            <div className="glass-card p-5 text-center border-[#f43f5e]/20">
              <div className="text-[#fb7185] font-semibold">Unable to load products</div>
              <div className="text-sm text-[#64748b] mt-1">{loadError}</div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="glass-card p-4 animate-pulse">
                  <div className="h-48 bg-white/[0.05] rounded-xl mb-4" />
                  <div className="h-5 bg-white/[0.05] rounded-lg w-3/4 mb-3" />
                  <div className="h-4 bg-white/[0.05] rounded-lg w-full mb-2" />
                  <div className="h-4 bg-white/[0.05] rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="text-5xl mb-3">📦</div>
              <div className="text-lg font-semibold text-white">No products yet</div>
              <div className="text-[#64748b] mt-1">Ask a seller to add products, then check back here.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product, i) => (
                <motion.article
                  key={product._id}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className="glass-card glass-card-hover overflow-hidden cursor-pointer group"
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(user ? `/shop/${product._id}` : '/login')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(user ? `/shop/${product._id}` : '/login');
                    }
                  }}
                >
                  <div className="relative h-52 img-zoom">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center text-4xl text-[#64748b]">📦</div>
                    )}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-sm font-bold text-white border border-white/10">
                      ${product.price}
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest mb-1.5">{product.category}</div>
                    <h3 className="font-semibold text-white mb-1.5 line-clamp-1 group-hover:text-[#c084fc] transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[#64748b] text-sm line-clamp-2 mb-3">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#64748b]">{product.stock} in stock</span>
                      <span className="text-xs font-semibold text-[#c084fc] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {user?.role !== 'seller' && (
            <div className="text-center mt-10">
              <Link href="/shop" className="btn-gradient py-3 px-8">
                View All Products
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Section ────────────────────────────── */}
      <section className="py-16 sm:py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '1000+', label: 'Products' },
              { value: '500+', label: 'Happy Customers' },
              { value: '50+', label: 'Trusted Sellers' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-6"
              >
                <div className="text-4xl sm:text-5xl font-extrabold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-[#64748b] font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
