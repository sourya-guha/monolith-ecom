'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { sellerApi } from '../../lib/api';

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

export default function SellerProducts() {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError(null);
        const data: any = await sellerApi.getProducts();
        setProducts(Array.isArray(data) ? data : data?.products || []);
        console.log('Fetched products:', Array.isArray(data) ? data : data?.products || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) return;

    if (user?.role === 'seller') {
      fetchProducts();
      return;
    }

    setLoading(false);
  }, [user, authLoading]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this Product?')) return;

    setDeletingProduct(productId);
    try {
      await sellerApi.deleteProduct(productId);
      setProducts((currentProducts) =>
        currentProducts.filter((Product) => Product._id !== productId)
      );
    } catch (err) {
      console.error('Failed to delete Product:', err);
      alert('Failed to delete Product. Please try again.');
    } finally {
      setDeletingProduct(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'seller') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">Restricted</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
            <p className="text-gray-600 mt-1">Manage your Product listings</p>
          </div>
          <Link
            href="/seller/products/add"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Product
          </Link>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">No Items</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Start building your catalog by adding your first Product.</p>
            <Link
              href="/seller/products/add"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600">
                <div className="col-span-1">Image</div>
                <div className="col-span-4">Product</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1">Price</div>
                <div className="col-span-1">Stock</div>
                <div className="col-span-3">Actions</div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {products.map((Product) => (
                <div key={Product._id} className="px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {Product.images?.length > 0 ? (
                          <img
                            src={Product.images[0]}
                            alt={Product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">Img</div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-4">
                      <h3 className="font-semibold text-gray-800 mb-1">{Product.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2">{Product.description}</p>
                    </div>

                    <div className="col-span-2">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {Product.category}
                      </span>
                    </div>

                    <div className="col-span-1">
                      <span className="font-semibold text-gray-800">${Product.price}</span>
                    </div>

                    <div className="col-span-1">
                      <span
                        className={`font-medium ${
                          Product.stock > 10
                            ? 'text-green-600'
                            : Product.stock > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {Product.stock}
                      </span>
                    </div>

                    <div className="col-span-3 flex gap-2">
                      <Link
                        href={`/seller/products/${Product._id}`}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(Product._id)}
                        disabled={deletingProduct === Product._id}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {deletingProduct === Product._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && !error && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{products.length}</div>
                <div className="text-gray-600">Total Products</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {products.reduce((sum, Product) => sum + Product.stock, 0)}
                </div>
                <div className="text-gray-600">Total Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  $
                  {products
                    .reduce((sum, Product) => sum + Product.price * Product.stock, 0)
                    .toFixed(2)}
                </div>
                <div className="text-gray-600">Inventory Value</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
