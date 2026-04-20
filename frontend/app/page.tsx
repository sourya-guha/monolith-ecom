'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { productApi } from './lib/api';
import { useAuth } from './lib/auth-context';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

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
        // Show first 6 products as featured
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
    { name: 'Electronics', icon: '📱' },
    { name: 'Clothing', icon: '👕' },
    { name: 'Books', icon: '📚' },
    { name: 'Home & Garden', icon: '🏠' },
    { name: 'Sports', icon: '⚽' },
    { name: 'Beauty', icon: '💄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to PROJECT-X
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Discover amazing products from trusted sellers. Shop with confidence and find everything you need.
          </p>
          <div className="flex gap-4 justify-center">
            {user?.role !== 'seller' && (
              <Link
                href="/shop"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now
              </Link>
            )}
            {!user && (
              <Link
                href="/signin"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Join Us
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link
                href="/seller/dashboard"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Manage My Store
              </Link>
            )}
          </div>
        </div>
      </motion.section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Shop by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/shop?category=${category.name.toLowerCase()}`}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-center"
                >
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Featured Products
          </h2>

          {loadError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mb-8">
              <div className="font-semibold">Unable to load products</div>
              <div className="text-sm mt-1">{loadError}</div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-3xl bg-white shadow-md p-6 space-y-4">
                  <div className="h-48 bg-gray-200 rounded-3xl" />
                  <div className="h-6 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-full w-5/6" />
                  <div className="h-4 bg-gray-200 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
              <div className="text-5xl mb-3">📦</div>
              <div className="text-lg font-semibold text-gray-800">No products yet</div>
              <div className="text-gray-600 mt-1">Ask a seller to add products, then check back here.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <motion.article
                  key={product._id}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="bg-gray-50 rounded-xl shadow-md hover:shadow-xl overflow-hidden cursor-pointer"
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
                  <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">📦</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-gray-800">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-2xl font-bold text-blue-600">
                        ${product.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.stock} in stock
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {user?.role !== 'seller' && (
            <div className="text-center mt-12">
              <Link
                href="/shop"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
              <div className="text-gray-600">Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Trusted Sellers</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
