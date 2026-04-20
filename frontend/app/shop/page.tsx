'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi, productApi } from '../lib/api';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth-context';

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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  
  const { addItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Redirect Sellers away from Shop
  useEffect(() => {
    if (user?.role === 'seller') {
      router.replace('/seller/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [productList, categoryList] = await Promise.all([
          userApi.getProducts() as Promise<Product[]>,
          productApi.getCategories() as Promise<string[]>
        ]);
        
        const safeProducts = Array.isArray(productList)
          ? productList.map((p) => ({
              ...p,
              images: Array.isArray((p as any).images) ? (p as any).images : [],
              stock: Number.isFinite(Number((p as any).stock)) ? Number((p as any).stock) : 0,
              price: Number.isFinite(Number((p as any).price)) ? Number((p as any).price) : 0,
            }))
          : [];
        setProducts(safeProducts);
        setFilteredProducts(safeProducts);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
      } catch (error) {
        console.error('Failed to fetch shop data:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products when search or category changes
  useEffect(() => {
    let result = products;

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Explore Our Collection</h1>
            <p className="text-gray-600 font-medium">Find the best products curated just for you</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm bg-white font-medium"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {loadError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-8">
            <div className="font-semibold">Unable to load products</div>
            <div className="text-sm mt-1">{loadError}</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 max-w-md mx-auto">We couldn't find any products matching your current filters. Try adjusting your search or category.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory('');}}
              className="mt-6 text-blue-600 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            <AnimatePresence mode='popLayout'>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col"
                >
                  <Link href={user ? `/shop/${product._id}` : '/login'} className="relative h-64 overflow-hidden block">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm">
                      ${product.price}
                    </div>
                  </Link>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">{product.category}</div>
                    <Link href={user ? `/shop/${product._id}` : '/login'}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{product.name}</h3>
                    </Link>
                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">{product.description}</p>
                    
                    {!!user && user.role !== 'seller' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem(product as any);
                        }}
                        disabled={product.stock <= 0}
                        className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                          product.stock > 0 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    )}
                    {user?.role === 'seller' && (
                      <div className="w-full py-3 rounded-xl bg-gray-50 text-gray-500 text-sm font-medium text-center border border-dashed border-gray-200">
                        View only mode
                      </div>
                    )}
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
