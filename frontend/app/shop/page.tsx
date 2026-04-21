'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { productApi, type PaginatedProductsResponse } from '../lib/api';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth-context';
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react';

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

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const PAGE_SIZE = 24;
  const isFirstLoad = useRef(true);

  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (user?.role === 'seller') {
      router.replace('/seller/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadError(null);
        if (isFirstLoad.current) {
          setInitialLoading(true);
        } else {
          setFiltering(true);
        }

        const [productResponse, categoryList] = await Promise.all([
          productApi.getProducts({
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch || undefined,
            category: selectedCategory || undefined,
          }) as Promise<PaginatedProductsResponse<Product>>,
          productApi.getCategories() as Promise<string[]>
        ]);

        const safeProducts = Array.isArray(productResponse?.data)
          ? productResponse.data.map((p) => ({
              ...p,
              images: Array.isArray((p as any).images) ? (p as any).images : [],
              stock: Number.isFinite(Number((p as any).stock)) ? Number((p as any).stock) : 0,
              price: Number.isFinite(Number((p as any).price)) ? Number((p as any).price) : 0,
            }))
          : [];

        setProducts(safeProducts);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setTotalPages(Math.max(Number(productResponse?.meta?.totalPages || 1), 1));
        setTotalProducts(Number(productResponse?.meta?.total || 0));
      } catch (error) {
        console.error('Failed to fetch shop data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to fetch products.');
      } finally {
        isFirstLoad.current = false;
        setInitialLoading(false);
        setFiltering(false);
      }
    };

    fetchData();
  }, [page, debouncedSearch, selectedCategory]);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Explore <span className="gradient-text">Collection</span>
            </h1>
            <p className="text-sm text-[#64748b]">
              {totalProducts} product{totalProducts !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-dark"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>

            {/* Category Filter */}
            <div className="relative sm:min-w-[200px]">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" size={16} />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="input-dark appearance-none cursor-pointer"
                style={{ paddingLeft: '2.75rem', paddingRight: '2.5rem' }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loadError ? (
          <div className="glass-card p-6 text-center border-[#f43f5e]/20">
            <div className="text-[#fb7185] font-semibold">Unable to load products</div>
            <div className="text-sm text-[#64748b] mt-1">{loadError}</div>
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-12 sm:p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-[#64748b] max-w-md mx-auto text-sm">Try adjusting your search or category filter.</p>
            <button
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                setSelectedCategory('');
                setPage(1);
              }}
              className="mt-6 text-[#c084fc] font-semibold hover:underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              {filtering && (
                <div className="absolute inset-0 z-10 bg-[#0a0a0f]/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                  <div className="spinner" />
                </div>
              )}
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
                    <Link href={user ? `/shop/${product._id}` : '/login'} className="relative h-56 img-zoom block">
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
                      <Link href={user ? `/shop/${product._id}` : '/login'}>
                        <h3 className="text-base font-semibold text-white mb-1 group-hover:text-[#c084fc] transition-colors line-clamp-1">{product.name}</h3>
                      </Link>
                      <p className="text-[#64748b] text-xs mb-4 line-clamp-2 flex-grow">{product.description}</p>

                      {!!user && user.role !== 'seller' && (
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
                      )}
                      {user?.role === 'seller' && (
                        <div className="w-full py-2.5 rounded-xl bg-white/[0.03] text-[#64748b] text-xs font-medium text-center border border-dashed border-white/[0.08]">
                          View only
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-white/10 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-[#94a3b8] px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg border border-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
