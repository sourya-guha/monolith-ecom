'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useAuth } from '../../lib/auth-context';
import { ShoppingCart } from 'lucide-react';

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

export default function CFRecommendationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        console.log('Fetching CF recommendations...');
        const data = await userApi.getCFRecommendations() as Product[];
        console.log('Fetched CF recommendations:', data);
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch CF recommendations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-10 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-[#94a3b8] mb-6">You need to log in to see personalized recommendations.</p>
          <Link href="/login" className="btn-gradient px-6 py-2.5 rounded-lg font-semibold inline-block">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            For You <span className="gradient-text">(Collaborative Filtering)</span>
          </h1>
          <p className="text-sm text-[#64748b]">
            Personalized recommendations based on what similar users liked.
          </p>
        </div>

        {error ? (
          <div className="glass-card p-6 text-center border-[#f43f5e]/20">
            <div className="text-[#fb7185] font-semibold">Unable to load recommendations</div>
            <div className="text-sm text-[#64748b] mt-1">{error}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-white mb-2">No recommendations yet</h3>
            <p className="text-[#64748b] text-sm">Keep exploring and interacting with products to get personalized suggestions!</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode='popLayout'>
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="glass-card glass-card-hover overflow-hidden group flex flex-col"
                >
                  <Link href={`/shop/${product._id}`} className="relative h-56 img-zoom block">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-sm font-bold text-white border border-white/10">
                      ${product.price}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest mb-1.5">{product.category}</div>
                    <Link href={`/shop/${product._id}`}>
                      <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#c084fc] transition-colors line-clamp-1">{product.name}</h3>
                    </Link>
                    <p className="text-[#64748b] text-xs mb-4 line-clamp-2 flex-grow">{product.description}</p>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(product as any);
                      }}
                      disabled={product.stock <= 0}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        product.stock > 0
                          ? 'btn-gradient shadow-lg'
                          : 'bg-white/[0.05] text-[#64748b] cursor-not-allowed border border-white/[0.06]'
                      }`}
                    >
                      <ShoppingCart size={15} />
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
